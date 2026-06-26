<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::where('user_id', auth()->id())
                           ->where('is_archived', false)
                           ->get();
        return response()->json($products, 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'pricePerUnit' => 'required|numeric',
            'stockQuantity' => 'required|numeric',
            'unit' => 'required|string',
            'reorderLevel' => 'required|integer',
            'sack_price' => 'nullable|numeric',
            'sack_weight' => 'nullable|numeric', // Added to validation
            'tubo' => 'nullable|numeric',
        ]);

        $userId = auth()->id();
        $validatedData['user_id'] = $userId;

        // --- QUEUE LOGIC ---
        $existsActive = Product::where('user_id', $userId)
                               ->where('name', $validatedData['name'])
                               ->where('is_archived', false)
                               ->exists();

        // If active version exists, hide this new one in Archive
        $validatedData['is_archived'] = $existsActive;

        $product = Product::create($validatedData);

        $statusMessage = $existsActive 
            ? 'Variety already active. New stock added to Archive (Queue).' 
            : 'Product added to active inventory.';

        return response()->json(['message' => $statusMessage, 'product' => $product], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'pricePerUnit' => 'required|numeric',
            'stockQuantity' => 'required|numeric',
            'unit' => 'required|string',
            'reorderLevel' => 'required|integer',
            'sack_price' => 'nullable|numeric',
            'sack_weight' => 'nullable|numeric', // Added to validation
            'tubo' => 'nullable|numeric',
        ]);
        
        // created_at is NOT validated here, so it is never updated.
        $product->update($validatedData);
        
        return response()->json(['message' => 'Product updated!', 'product' => $product]);
    }

    public function archive($id)
    {
        $product = Product::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $product->update(['is_archived' => true]);
        return response()->json(['message' => 'Product archived successfully']);
    }

    public function destroy($id)
    {
        $product = Product::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $product->delete();
        return response()->json(['message' => 'Product deleted permanently']);
    }

    public function archived()
    {
        $products = Product::where('user_id', auth()->id())
                           ->where('is_archived', true)
                           ->get();
        return response()->json($products, 200);
    }

    public function unarchive($id)
    {
        $product = Product::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $product->is_archived = false;
        $product->save();
        
        return response()->json($product, 200);
    }
}