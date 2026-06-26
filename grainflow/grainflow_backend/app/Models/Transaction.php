<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'user_id',
        'quantity',
        'total_price',
        'payment_method',
        'customer_name',
        'status',
        'discount_applied',
        'created_at' 
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}