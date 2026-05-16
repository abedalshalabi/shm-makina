import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import SEO from "../components/SEO";
import { categoriesAPI } from "../services/api";
import { ChevronRight } from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getStorageUrl } from "../config/env";

interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  parent_id?: number | null;
  sort_order?: number | null;
  slug?: string;
  color?: string | null;
  level?: number | null;
  filters?: unknown;
  show_in_slider?: boolean | number | string;
  is_active?: boolean | number | string;
  meta_title?: string | null;
  meta_description?: string | null;
  children?: Category[];
  [key: string]: unknown;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
}

const CategoriesPage = () => {
  const { siteName } = useSiteSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const flattenCategories = (nodes: unknown[]): Category[] => {
      const map = new Map<number, Category>();

      const traverse = (items: unknown[]) => {
        items.forEach((item) => {
          if (!item || typeof item !== "object") {
            return;
          }

          const category = item as Category;
          const normalizedId = Number(category.id);
          const normalizedParentId = category.parent_id !== null && category.parent_id !== undefined
            ? Number(category.parent_id)
            : null;

          const { children, ...rest } = category;

          map.set(normalizedId, {
            ...rest,
            id: normalizedId,
            parent_id: normalizedParentId,
          });

          if (Array.isArray(children) && children.length > 0) {
            traverse(children);
          }
        });
      };

      traverse(nodes);
      return Array.from(map.values());
    };

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await categoriesAPI.getCategories();
        console.log("Categories API response:", response);
        const flattened = flattenCategories(response?.data ?? []);
        setCategories(flattened);
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("حدث خطأ أثناء تحميل التصنيفات. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log("Categories loaded into state:", categories);
    }
  }, [categories, loading]);

  const rootCategories = useMemo<CategoryNode[]>(() => {
    if (!categories.length) {
      return [];
    }

    const sortCategories = (a: Category, b: Category) => {
      const sortA = a.sort_order ?? 0;
      const sortB = b.sort_order ?? 0;
      if (sortA === sortB) {
        return a.name.localeCompare(b.name);
      }
      return sortA - sortB;
    };

    const nodeMap = new Map<number, CategoryNode>();

    categories.forEach((cat) => {
      const normalizedId = Number(cat.id);
      const normalizedParentId = cat.parent_id !== null && cat.parent_id !== undefined
        ? Number(cat.parent_id)
        : null;

      const node: CategoryNode = {
        ...cat,
        id: normalizedId,
        parent_id: normalizedParentId,
        children: [],
      };

      nodeMap.set(normalizedId, node);
    });

    const fanCategory = Array.from(nodeMap.values()).find((node) => node.name.includes("مراوح"));
    console.log("Fan category (raw):", fanCategory);

    const roots: CategoryNode[] = [];

    nodeMap.forEach((node) => {
      if (node.parent_id !== null && node.parent_id !== undefined) {
        const parentNode = nodeMap.get(node.parent_id);
        if (parentNode) {
          // Add parent name to child name for display
          node.name = `${node.name} (${parentNode.name})`;
          parentNode.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    if (fanCategory) {
      const parent = fanCategory.parent_id ? nodeMap.get(fanCategory.parent_id) : null;
      console.log("Fan category parent:", parent);
    }

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => sortCategories(a, b));
      nodes.forEach((child) => sortTree(child.children));
    };

    sortTree(roots);

    if (fanCategory) {
      const findPath = (nodes: CategoryNode[], targetId: number, path: string[] = []): string[] | null => {
        for (const node of nodes) {
          const newPath = [...path, node.name];
          if (node.id === targetId) {
            return newPath;
          }
          const childResult = findPath(node.children, targetId, newPath);
          if (childResult) {
            return childResult;
          }
        }
        return null;
      };

      const path = findPath(roots, fanCategory.id) ?? [];
      console.log("Path to fan category:", path);
    }

    console.log("Built category tree:", roots);

    return roots;
  }, [categories]);

  // Flatten all children recursively for mobile view
  const flattenAllChildren = (node: CategoryNode): CategoryNode[] => {
    const result: CategoryNode[] = [];
    const traverse = (n: CategoryNode) => {
      if (n.children && n.children.length > 0) {
        n.children.forEach((child) => {
          result.push(child);
          traverse(child);
        });
      }
    };
    traverse(node);
    return result;
  };

  const renderChildLevel = (nodes: CategoryNode[], depth: number): React.ReactNode => {
    if (!nodes.length) {
      return null;
    }

    const isFirstLevel = depth === 1;
    const chunkSize = isFirstLevel ? 3 : 4;
    const rows: CategoryNode[][] = [];

    for (let i = 0; i < nodes.length; i += chunkSize) {
      rows.push(nodes.slice(i, i + chunkSize));
    }

    return (
      <div className="w-full flex flex-col items-center gap-6">
        {rows.map((row, rowIndex) => (
          <div
            key={`${depth}-${rowIndex}`}
            className={`relative w-full flex justify-center gap-6 flex-wrap ${rowIndex === 0 ? "pt-8" : "pt-8 mt-4"
              }`}
          >
            <div className="absolute top-2 left-0 right-0 flex justify-center">
              <div className="w-[70%] max-w-[360px] h-0.5 bg-emerald-100" />
            </div>
            {rowIndex > 0 && (
              <div className="absolute left-1/2 -top-6 h-6 w-0.5 bg-emerald-100" />
            )}
            {row.map((node) => {
              let connectorTopClass = "-top-4";
              let connectorHeightClass = "h-4";

              if (depth === 1) {
                if (rowIndex === 0) {
                  connectorTopClass = "-top-8";
                  connectorHeightClass = "h-8";
                } else {
                  connectorTopClass = "-top-6";
                  connectorHeightClass = "h-6";
                }
              }

              const sizeClasses =
                depth === 1
                  ? "w-20 h-20 border-4"
                  : depth === 2
                    ? "w-16 h-16 border-2"
                    : "w-14 h-14 border";

              return (
                <div key={node.id} className="flex flex-col items-center gap-2">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`hidden md:block absolute ${connectorTopClass} ${connectorHeightClass} w-0.5 bg-emerald-100`}
                    />
                    <Link
                      to={`/products?category_id=${node.id}`}
                      className={`${sizeClasses} rounded-full border-emerald-50 bg-white shadow hover:shadow-lg flex items-center justify-center overflow-hidden hover:border-emerald-200 transition-all`}
                      aria-label={node.name}
                    >
                      {node.image ? (
                        <img
                          src={getStorageUrl(node.image)}
                          alt={node.name}
                          width="80"
                          height="80"
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className={
                            depth === 1
                              ? "text-sm font-semibold text-emerald-600 text-center px-2"
                              : "text-[11px] font-semibold text-emerald-600 text-center px-2 leading-tight"
                          }
                        >
                          {node.name.length > 4 ? `${node.name.slice(0, 4)}…` : node.name}
                        </span>
                      )}
                    </Link>
                  </div>
                  <Link
                    to={`/products?category_id=${node.id}`}
                    className={
                      depth === 1
                        ? "text-xs font-medium text-gray-600 hover:text-emerald-600 transition-colors text-center w-24 leading-snug"
                        : "text-[11px] font-medium text-gray-500 hover:text-emerald-600 transition-colors text-center w-24 leading-tight"
                    }
                  >
                    {node.name}
                  </Link>
                  {node.children.length > 0 && (
                    <div className="mt-2 w-full flex justify-center">
                      <div className="hidden md:block w-0.5 h-4 bg-emerald-100" />
                    </div>
                  )}
                  {node.children.length > 0 && renderChildLevel(node.children, depth + 1)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = `${siteUrl}/categories`;

  // Structured Data for Categories Page
  const structuredDataArray = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": siteName ? `جميع التصنيفات - ${siteName}` : "جميع التصنيفات",
      "description": siteName ? `تصفح جميع تصنيفات المنتجات في ${siteName}` : "تصفح جميع تصنيفات المنتجات",
      "url": currentUrl
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "الرئيسية",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "التصنيفات",
          "item": currentUrl
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 arabic">
      <SEO
        title={siteName ? `جميع التصنيفات - ${siteName}` : "جميع التصنيفات"}
        description={siteName ? `تصفح جميع تصنيفات المنتجات في ${siteName}` : "تصفح جميع تصنيفات المنتجات"}
        keywords={`تصنيفات, أجهزة كهربائية, إلكترونيات${siteName ? `, ${siteName}` : ''}`}
        structuredData={structuredDataArray}
      />
      <Header showSearch showActions />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">جميع التصنيفات</h1>
          <p className="text-gray-600">
            تصفح الفئات الرئيسية والفئات الفرعية لكل قسم للوصول السريع إلى المنتجات المناسبة.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-600">
            {error}
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-12 text-center text-gray-500">
            لا توجد تصنيفات متاحة حالياً.
          </div>
        ) : (
          <>
            {/* Mobile View - All categories as circles */}
            <div className="md:hidden">
              <div className="flex flex-wrap justify-center gap-4">
                {rootCategories.map((parent) => {
                  const allChildren = flattenAllChildren(parent);
                  return (
                    <React.Fragment key={parent.id}>
                      {/* Parent Category */}
                      <Link
                        to={`/products?category_id=${parent.id}`}
                        className="flex flex-col items-center gap-2 group"
                        aria-label={parent.name}
                      >
                        <div className="w-20 h-20 rounded-full border-2 border-emerald-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex items-center justify-center">
                          {parent.image ? (
                            <img
                              src={getStorageUrl(parent.image)}
                              alt={parent.name}
                              width="80"
                              height="80"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-500 text-sm font-semibold">
                              {parent.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-gray-600 text-center max-w-[90px] leading-tight">
                          {parent.name}
                        </span>
                      </Link>
                      {/* All Children Categories (all levels) */}
                      {allChildren.map((child) => (
                        <Link
                          key={child.id}
                          to={`/products?category_id=${child.id}`}
                          className="flex flex-col items-center gap-2 group"
                          aria-label={child.name}
                        >
                          <div className="w-20 h-20 rounded-full border-2 border-emerald-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex items-center justify-center">
                            {child.image ? (
                              <img
                                src={getStorageUrl(child.image)}
                                alt={child.name}
                                width="80"
                                height="80"
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-500 text-sm font-semibold">
                                {child.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-gray-600 text-center max-w-[90px] leading-tight">
                            {child.name}
                          </span>
                        </Link>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Desktop View - Grid layout */}
            <div className="hidden md:grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {rootCategories.map((parent) => (
                <div
                  key={parent.id}
                  className="group bg-white rounded-3xl shadow-md hover:shadow-xl transition-transform hover:-translate-y-1 border border-gray-100 px-8 py-10 flex flex-col items-center"
                >
                  <div className="relative mb-6 flex flex-col items-center">
                    <Link
                      to={`/products?category_id=${parent.id}`}
                      className="block w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-emerald-100 overflow-hidden shadow-lg transition-transform duration-700 group-hover:scale-105"
                      aria-label={parent.name}
                    >
                      {parent.image ? (
                        <img
                          src={getStorageUrl(parent.image)}
                          alt={parent.name}
                          width="160"
                          height="160"
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-500 text-4xl font-bold">
                          {parent.name.charAt(0)}
                        </div>
                      )}
                    </Link>
                    {parent.children.length > 0 && (
                      <div className="mt-4 w-0.5 h-10 bg-emerald-200/80" />
                    )}
                  </div>

                  <Link
                    to={`/products?category_id=${parent.id}`}
                    className="text-xl font-semibold text-gray-800 hover:text-emerald-600 transition-colors"
                  >
                    {parent.name}
                  </Link>
                  <p className="text-sm text-gray-500 text-center px-4 mt-2 leading-relaxed">
                    {parent.description || "استكشف المنتجات والفئات الفرعية الخاصة بهذا القسم."}
                  </p>

                  {parent.children.length > 0 ? (
                    renderChildLevel(parent.children, 1)
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-4 py-6 text-center text-sm text-gray-400 w-full mt-6">
                      لا توجد فئات فرعية لهذا التصنيف حالياً.
                    </div>
                  )}

                  <div className="flex justify-end w-full mt-8">
                    <Link
                      to={`/products?category_id=${parent.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      تصفح جميع منتجات {parent.name}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CategoriesPage;