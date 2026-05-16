<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Offer;
use App\Support\AppUrl;
use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function index(Request $request): Response
    {
        $siteUrl = $this->resolveSiteUrl($request);

        // Cache sitemap for 24 hours
        $sitemap = Cache::remember('sitemap_xml_' . md5($siteUrl), 60, function () use ($siteUrl) {
            return $this->generateSitemap($siteUrl);
        });

        return response($sitemap, 200)
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Generate sitemap XML content
     */
    private function generateSitemap(string $siteUrl): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
        $xml .= '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' . "\n";
        $xml .= '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' . "\n";
        $xml .= '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9' . "\n";
        $xml .= '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">' . "\n\n";

        // Homepage
        $xml .= $this->addUrl($siteUrl . '/', '1.0', 'daily', now()->toDateString());

        // Specialized Category Paths (SEO Aliases)

        // Products Page
        $xml .= $this->addUrl($siteUrl . '/products', '0.8', 'daily', now()->toDateString());

        // Categories Page
        $xml .= $this->addUrl($siteUrl . '/categories', '0.7', 'weekly', now()->toDateString());

        // Brands Page
        $xml .= $this->addUrl($siteUrl . '/brands', '0.7', 'weekly', now()->toDateString());

        // Offers Page
        $xml .= $this->addUrl($siteUrl . '/offers', '0.8', 'daily', now()->toDateString());

        // Static Pages
        $staticPages = [
            ['url' => '/about', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/contact', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['url' => '/shipping', 'priority' => '0.4', 'changefreq' => 'monthly'],
            ['url' => '/returns', 'priority' => '0.4', 'changefreq' => 'monthly'],
            ['url' => '/warranty', 'priority' => '0.4', 'changefreq' => 'monthly'],
        ];

        foreach ($staticPages as $page) {
            $xml .= $this->addUrl($siteUrl . $page['url'], $page['priority'], $page['changefreq'], now()->toDateString());
        }

        // Active Products
        $products = Product::where('is_active', 1)
            ->select('id', 'name', 'images', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($products as $product) {
            $lastmod = $product->updated_at ? $product->updated_at->toDateString() : now()->toDateString();
            
            // Get product image
            $imageUrl = null;
            if (is_array($product->images) && !empty($product->images)) {
                $firstImage = $product->images[0];
                $imageUrl = is_array($firstImage) ? ($firstImage['image_url'] ?? null) : $firstImage;
            }
            $imageUrl = MediaUrl::publicUrl($imageUrl);

            $imageXml = "";
            if ($imageUrl) {
                $imageXml = "    <image:image>\n";
                $imageXml .= "      <image:loc>" . htmlspecialchars($imageUrl, ENT_XML1, 'UTF-8') . "</image:loc>\n";
                $imageXml .= "      <image:title>" . htmlspecialchars($product->name, ENT_XML1, 'UTF-8') . "</image:title>\n";
                $imageXml .= "    </image:image>\n";
            }

            $xml .= $this->addUrl($siteUrl . '/product/' . $product->id, '0.7', 'weekly', $lastmod, $imageXml);
        }

        // Active Categories
        $categories = Category::where('is_active', 1)
            ->select('id', 'name', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($categories as $category) {
            $lastmod = $category->updated_at ? $category->updated_at->toDateString() : now()->toDateString();
            $xml .= $this->addUrl($siteUrl . '/products?category_id=' . $category->id, '0.6', 'weekly', $lastmod);
        }

        // Active Brands
        $brands = Brand::where('is_active', 1)
            ->select('id', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($brands as $brand) {
            $lastmod = $brand->updated_at ? $brand->updated_at->toDateString() : now()->toDateString();
            $xml .= $this->addUrl($siteUrl . '/products?brand_id=' . $brand->id, '0.5', 'weekly', $lastmod);
        }

        // Active Offers
        $offers = Offer::where('is_active', 1)
            ->where('ends_at', '>', now())
            ->select('id', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($offers as $offer) {
            $lastmod = $offer->updated_at ? $offer->updated_at->toDateString() : now()->toDateString();
            $xml .= $this->addUrl($siteUrl . '/offers', '0.8', 'daily', $lastmod);
        }

        $xml .= '</urlset>';

        return $xml;
    }

    private function resolveSiteUrl(Request $request): string
    {
        $configuredUrl = rtrim((string) AppUrl::frontend(), '/');
        if ($configuredUrl !== '') {
            $host = strtolower((string) parse_url($configuredUrl, PHP_URL_HOST));
            $isLocal =
                $host === 'localhost' ||
                $host === '127.0.0.1' ||
                $host === '::1' ||
                str_ends_with($host, '.local');

            if (!$isLocal) {
                return $configuredUrl;
            }
        }

        return rtrim($request->getSchemeAndHttpHost(), '/');
    }

    /**
     * Add a URL entry to sitemap
     */
    private function addUrl(string $loc, string $priority, string $changefreq, string $lastmod, string $extraXml = ""): string
    {
        $xml = "  <url>\n";
        $xml .= "    <loc>" . htmlspecialchars($loc, ENT_XML1, 'UTF-8') . "</loc>\n";
        $xml .= "    <lastmod>" . $lastmod . "</lastmod>\n";
        $xml .= "    <changefreq>" . $changefreq . "</changefreq>\n";
        $xml .= "    <priority>" . $priority . "</priority>\n";
        $xml .= $extraXml;
        $xml .= "  </url>\n\n";
        
        return $xml;
    }
}

