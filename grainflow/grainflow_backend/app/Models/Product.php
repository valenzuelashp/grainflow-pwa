<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'category',
        'pricePerUnit',
        'sack_price',
        'sack_weight',
        'tubo',
        'is_archived',
        'stockQuantity',
        'unit',
        'reorderLevel'
    ];

    /**
     * Permanent Timestamp Guard:
     * Ensures created_at is never modified during updates.
     */
    protected static function boot()
    {
        parent::boot();

        static::updating(function ($product) {
            // Force created_at to stay as its original value
            if ($product->isDirty('created_at')) {
                $product->created_at = $product->getOriginal('created_at');
            }
        });
    }
}