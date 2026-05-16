<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    /**
     * Store a new contact message
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $contactMessage = ContactMessage::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'subject' => $request->subject,
                'message' => $request->message,
                'status' => 'new',
            ]);

            Log::info('New contact message received', [
                'id' => $contactMessage->id,
                'name' => $contactMessage->name,
                'email' => $contactMessage->email,
                'subject' => $contactMessage->subject,
            ]);

            return response()->json([
                'message' => 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
                'data' => [
                    'id' => $contactMessage->id,
                    'name' => $contactMessage->name,
                    'email' => $contactMessage->email,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error storing contact message', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'message' => 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all contact messages (Admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContactMessage::query();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $messages = $query->paginate($perPage);

        return response()->json([
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Get single contact message (Admin)
     */
    public function show(string $id): JsonResponse
    {
        $message = ContactMessage::find($id);

        if (!$message) {
            return response()->json([
                'message' => 'Message not found',
            ], 404);
        }

        return response()->json([
            'data' => $message,
        ]);
    }

    /**
     * Update contact message status (Admin)
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:new,read,replied',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $message = ContactMessage::find($id);

        if (!$message) {
            return response()->json([
                'message' => 'Message not found',
            ], 404);
        }

        $message->update([
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Status updated successfully',
            'data' => $message,
        ]);
    }

    /**
     * Delete contact message (Admin)
     */
    public function destroy(string $id): JsonResponse
    {
        $message = ContactMessage::find($id);

        if (!$message) {
            return response()->json([
                'message' => 'Message not found',
            ], 404);
        }

        $message->delete();

        return response()->json([
            'message' => 'Message deleted successfully',
        ]);
    }
}

