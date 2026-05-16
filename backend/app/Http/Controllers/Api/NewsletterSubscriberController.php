<?php

namespace App\Http\Controllers\Api;

use App\Exports\NewsletterSubscribersExport;
use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;

class NewsletterSubscriberController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255',
            'source' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = mb_strtolower(trim($request->email));

        try {
            $subscriber = NewsletterSubscriber::where('email', $email)->first();

            if ($subscriber && $subscriber->status === 'active') {
                return response()->json([
                    'message' => 'هذا البريد مشترك بالفعل في النشرة البريدية.',
                    'data' => $subscriber,
                ]);
            }

            if ($subscriber) {
                $subscriber->update([
                    'status' => 'active',
                    'source' => $request->source ?: $subscriber->source,
                    'subscribed_at' => now(),
                    'unsubscribed_at' => null,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            } else {
                $subscriber = NewsletterSubscriber::create([
                    'email' => $email,
                    'status' => 'active',
                    'source' => $request->source,
                    'subscribed_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            return response()->json([
                'message' => 'تم الاشتراك في النشرة البريدية بنجاح.',
                'data' => $subscriber,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error storing newsletter subscriber', [
                'error' => $e->getMessage(),
                'email' => $email,
            ]);

            return response()->json([
                'message' => 'حدث خطأ أثناء الاشتراك. يرجى المحاولة مرة أخرى.',
            ], 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->buildQuery($request);

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $perPage = $request->get('per_page', 15);

        $subscribers = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

        return response()->json([
            'data' => $subscribers->items(),
            'meta' => [
                'current_page' => $subscribers->currentPage(),
                'last_page' => $subscribers->lastPage(),
                'per_page' => $subscribers->perPage(),
                'total' => $subscribers->total(),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $subscribers = $this->buildQuery($request)
            ->orderBy('created_at', 'desc')
            ->get();

        $fileName = 'newsletter-subscribers-' . now()->format('Y-m-d-H-i') . '.xlsx';

        return Excel::download(new NewsletterSubscribersExport($subscribers), $fileName);
    }

    public function show(string $id): JsonResponse
    {
        $subscriber = NewsletterSubscriber::find($id);

        if (!$subscriber) {
            return response()->json([
                'message' => 'Subscriber not found',
            ], 404);
        }

        return response()->json([
            'data' => $subscriber,
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,unsubscribed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $subscriber = NewsletterSubscriber::find($id);

        if (!$subscriber) {
            return response()->json([
                'message' => 'Subscriber not found',
            ], 404);
        }

        $subscriber->update([
            'status' => $request->status,
            'subscribed_at' => $request->status === 'active' ? now() : $subscriber->subscribed_at,
            'unsubscribed_at' => $request->status === 'unsubscribed' ? now() : null,
        ]);

        return response()->json([
            'message' => 'Subscriber status updated successfully',
            'data' => $subscriber,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $subscriber = NewsletterSubscriber::find($id);

        if (!$subscriber) {
            return response()->json([
                'message' => 'Subscriber not found',
            ], 404);
        }

        $subscriber->delete();

        return response()->json([
            'message' => 'Subscriber deleted successfully',
        ]);
    }

    private function buildQuery(Request $request)
    {
        $query = NewsletterSubscriber::query();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('source', 'like', "%{$search}%");
            });
        }

        return $query;
    }
}
