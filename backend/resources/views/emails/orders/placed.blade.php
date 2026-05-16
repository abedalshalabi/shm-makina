<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تفاصيل الطلب</title>
    <style>
        @media only screen and (max-width: 640px) {
            .email-shell { padding: 14px 10px !important; }
            .email-card { border-radius: 16px !important; }
            .email-content, .hero-block { padding: 18px 14px !important; }
            .hero-block h1 { font-size: 26px !important; line-height: 1.35 !important; }
            .hero-block p,
            .email-content > div:first-child > div:first-child,
            .email-content > div:nth-child(3) > div:first-child {
                font-size: 16px !important;
            }
            .email-content > div:first-child > div > div span:last-child,
            .email-content > div:nth-child(4) > div span:last-child {
                display: block !important;
                float: none !important;
                margin-top: 6px !important;
                text-align: right !important;
                max-width: 100% !important;
            }
            .item-table, .item-table tbody, .item-table tr, .item-table td,
            .info-table, .info-table tbody, .info-table tr, .info-table td {
                display: block !important;
                width: 100% !important;
            }
            .item-image-cell {
                width: 100% !important;
                padding-right: 0 !important;
                padding-bottom: 12px !important;
            }
            .item-image {
                width: 100% !important;
                max-width: 220px !important;
                height: auto !important;
                margin: 0 auto !important;
            }
            .info-table td { padding: 0 0 12px 0 !important; }
            .info-table td:last-child { padding-bottom: 0 !important; }
            .action-link {
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
                margin: 0 0 10px 0 !important;
                text-align: center !important;
            }
            .action-link:last-child { margin-bottom: 0 !important; }
        }
    </style>
</head>
<body dir="rtl" style="margin:0;padding:0;background:#f8f5f0;font-family:Arial,Helvetica,sans-serif;color:#1f2937;direction:rtl;text-align:right;">
        <div dir="rtl" class="email-shell" style="max-width:760px;margin:0 auto;padding:24px 14px;direction:rtl;text-align:right;">
        <div style="text-align:center;margin-bottom:18px;direction:rtl;">
            @php
                $resolvedLogoSrc = (!empty($logoPath) && isset($message)) ? $message->embed($logoPath) : $logoUrl;
            @endphp
            <img src="{{ $resolvedLogoSrc }}" alt="{{ $siteName }}" style="max-height:56px;max-width:180px;width:auto;">
        </div>

        <div dir="rtl" class="email-card" style="background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #eadfce;box-shadow:0 8px 30px rgba(100,85,43,.08);">
            <div class="hero-block" style="background:linear-gradient(135deg,#ac9d7f 0%,#c4b59b 100%);padding:28px 24px;color:#ffffff;text-align:center;direction:rtl;">
                <div style="font-size:72px;line-height:1;margin-bottom:12px;">✓</div>
                <h1 style="margin:0 0 8px;font-size:34px;font-weight:700;">{{ $recipientType === 'admin' ? 'تم استلام طلب جديد' : 'تم تأكيد طلبك بنجاح!' }}</h1>
                <p style="margin:0;font-size:18px;opacity:.95;">
                    {{ $recipientType === 'admin' ? 'تم إنشاء طلب جديد في متجر روبيتا' : 'شكراً لك على التسوق معنا' }}
                </p>
            </div>

            <div dir="rtl" class="email-content" style="padding:24px;direction:rtl;text-align:right;">
                <div style="background:#fff;border:1px solid #eadfce;border-radius:18px;padding:22px;margin-bottom:22px;">
                    <div style="font-size:23px;font-weight:700;margin-bottom:16px;text-align:center;">تفاصيل الطلب</div>

                    <div style="display:block;">
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">رقم الطلب:</span>
                            <span style="float:left;color:#7c6d47;font-weight:700;" dir="ltr">{{ $order->order_number }}</span>
                        </div>
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">اسم العميل:</span>
                            <span style="float:left;">{{ $order->customer_name }}</span>
                        </div>
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">رقم الهاتف:</span>
                            <span style="float:left;" dir="ltr">{{ $order->customer_phone }}</span>
                        </div>
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">البريد الإلكتروني:</span>
                            <span style="float:left;" dir="ltr">{{ $order->customer_email }}</span>
                        </div>
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">عنوان المشتري:</span>
                            <span style="float:left;max-width:60%;text-align:left;direction:rtl;">{{ $customerAddress ?: 'غير محدد' }}</span>
                        </div>
                        @if($order->customer_additional_info)
                            <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                                <span style="font-weight:700;">معلومات إضافية:</span>
                                <span style="float:left;max-width:60%;text-align:left;direction:rtl;">{{ $order->customer_additional_info }}</span>
                            </div>
                        @endif
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">طريقة الدفع:</span>
                            <span style="float:left;">{{ $paymentMethodLabel }}</span>
                        </div>
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">موعد التوصيل المتوقع:</span>
                            <span style="float:left;">2 أيام عمل</span>
                        </div>
                        <div style="padding:12px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;">حالة الطلب:</span>
                            <span style="float:left;color:#ac9d7f;font-weight:700;">{{ $orderStatusLabel }}</span>
                        </div>
                        <div style="padding:12px 0;">
                            <span style="font-weight:700;">تاريخ الطلب:</span>
                            <span style="float:left;">{{ optional($order->created_at)->format('Y-m-d h:i A') }}</span>
                        </div>
                    </div>
                </div>

                <div style="background:#f3ede4;border:1px solid #ddcfba;border-radius:18px;padding:20px;margin-bottom:22px;">
                    <div style="font-size:19px;font-weight:700;color:#0f172a;margin-bottom:12px;">الخطوات التالية</div>
                    <div style="margin-bottom:10px;"><strong>1.</strong> تحضير الطلب: سنقوم بتحضير طلبك وتعبئته بعناية.</div>
                    <div style="margin-bottom:10px;"><strong>2.</strong> الشحن: سيتم شحن طلبك خلال 24 ساعة.</div>
                    <div><strong>3.</strong> التوصيل: سيصل الطلب إلى العنوان المحدد خلال 2-3 أيام.</div>
                </div>

                @if(!empty($order->notes))
                    <div style="background:#ffffff;border:1px solid #eadfce;border-radius:18px;padding:18px;margin-bottom:22px;">
                        <div style="font-size:17px;font-weight:700;margin-bottom:8px;">ملاحظات الطلب</div>
                        <div style="font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">{!! nl2br(e($order->notes)) !!}</div>
                    </div>
                @endif

                <div style="margin-bottom:22px;">
                    <div style="font-size:20px;font-weight:700;margin-bottom:14px;">عناصر الطلب</div>

                    @foreach($orderItems as $item)
                        <div style="border:1px solid #eadfce;border-radius:18px;background:#ffffff;padding:14px;margin-bottom:14px;direction:rtl;">
                            <table role="presentation" class="item-table" style="width:100%;border-collapse:collapse;">
                                <tr>
                                    <td class="item-image-cell" style="width:108px;vertical-align:top;padding-left:0;padding-right:12px;">
                                        @if(!empty($item['image_url']) || !empty($item['image_path']))
                                            @php
                                                $resolvedItemImageSrc = (!empty($item['image_path']) && isset($message))
                                                    ? $message->embed($item['image_path'])
                                                    : $item['image_url'];
                                            @endphp
                                            @if($item['product_url'])
                                                <a href="{{ $item['product_url'] }}" target="_blank" style="text-decoration:none;">
                                                    <img src="{{ $resolvedItemImageSrc }}" alt="{{ $item['name'] }}" class="item-image" style="width:96px;height:96px;object-fit:cover;border-radius:14px;border:1px solid #eadfce;display:block;">
                                                </a>
                                            @else
                                                <img src="{{ $resolvedItemImageSrc }}" alt="{{ $item['name'] }}" class="item-image" style="width:96px;height:96px;object-fit:cover;border-radius:14px;border:1px solid #eadfce;display:block;">
                                            @endif
                                        @endif
                                    </td>
                                    <td style="vertical-align:top;">
                                        <div style="font-size:17px;font-weight:700;margin-bottom:6px;">
                                            @if($item['product_url'])
                                                <a href="{{ $item['product_url'] }}" target="_blank" style="color:#111827;text-decoration:none;">{{ $item['name'] }}</a>
                                            @else
                                                {{ $item['name'] }}
                                            @endif
                                        </div>
                                        @if($item['sku'])
                                            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">SKU: {{ $item['sku'] }}</div>
                                        @endif
                                        @if(!empty($item['variant_values']))
                                            <div style="font-size:13px;color:#374151;margin-bottom:8px;">
                                                @foreach($item['variant_values'] as $variantKey => $variantValue)
                                                    <div>{{ $variantKey }}: {{ $variantValue }}</div>
                                                @endforeach
                                            </div>
                                        @endif
                                        <div style="font-size:14px;color:#374151;margin-bottom:4px;">الكمية: {{ $item['quantity'] }}</div>
                                        <div style="font-size:14px;color:#374151;margin-bottom:4px;">السعر: {{ number_format($item['price'], 2) }} شيكل</div>
                                        @if($item['original_price'] > $item['price'])
                                            <div style="font-size:12px;color:#9ca3af;text-decoration:line-through;margin-bottom:4px;">قبل الخصم: {{ number_format($item['original_price'], 2) }} شيكل</div>
                                        @endif
                                        <div style="font-size:16px;color:#7c6d47;font-weight:700;">الإجمالي: {{ number_format($item['total'], 2) }} شيكل</div>
                                        @if(($item['line_discount'] ?? 0) > 0)
                                            <div style="font-size:13px;color:#b91c1c;margin-bottom:6px;">
                                                خصم المنتج: -{{ number_format((float) $item['line_discount'], 2) }} شيكل
                                                @if(($item['discount_percentage'] ?? 0) > 0)
                                                    ({{ rtrim(rtrim(number_format((float) $item['discount_percentage'], 2), '0'), '.') }}%)
                                                @endif
                                            </div>
                                        @endif
                                        @if($item['product_url'])
                                            <div style="margin-top:10px;">
                                                <a href="{{ $item['product_url'] }}" target="_blank" style="display:inline-block;color:#7c6d47;text-decoration:none;font-weight:700;">عرض المنتج</a>
                                            </div>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </div>
                    @endforeach
                </div>

                <div style="background:#ffffff;border:1px solid #eadfce;border-radius:18px;padding:20px;margin-bottom:22px;">
                    <div style="padding:10px 0;border-bottom:1px solid #efe7db;">
                        <span style="font-weight:700;">المجموع الفرعي:</span>
                        <span style="float:left;">{{ number_format((float) $order->subtotal, 2) }} شيكل</span>
                    </div>
                    <div style="padding:10px 0;border-bottom:1px solid #efe7db;">
                        <span style="font-weight:700;">تكلفة الشحن:</span>
                        <span style="float:left;{{ (float) $order->shipping_cost === 0.0 ? 'color:#7c6d47;font-weight:700;' : '' }}">
                            {{ (float) $order->shipping_cost === 0.0 ? 'مجاني' : number_format((float) $order->shipping_cost, 2) . ' شيكل' }}
                        </span>
                    </div>
                    @if(($discountSummary['items_discount_total'] ?? 0) > 0)
                        <div style="padding:10px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;color:#b91c1c;">خصم المنتجات:</span>
                            <span style="float:left;color:#b91c1c;">
                                -{{ number_format((float) $discountSummary['items_discount_total'], 2) }} شيكل
                            </span>
                        </div>
                    @endif
                    @if(($discountSummary['order_level_discount'] ?? 0) > 0)
                        <div style="padding:10px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;color:#b91c1c;">خصم إضافي على الطلب:</span>
                            <span style="float:left;color:#b91c1c;">
                                -{{ number_format((float) $discountSummary['order_level_discount'], 2) }} شيكل
                            </span>
                        </div>
                    @endif
                    @if(($discountSummary['total_discount'] ?? 0) > 0)
                        <div style="padding:10px 0;border-bottom:1px solid #efe7db;">
                            <span style="font-weight:700;color:#b91c1c;">إجمالي الخصومات:</span>
                            <span style="float:left;color:#b91c1c;">
                                -{{ number_format((float) $discountSummary['total_discount'], 2) }} شيكل
                            </span>
                        </div>
                    @endif
                    <div style="padding:14px 0 0;font-size:22px;font-weight:700;">
                        <span>المجموع الكلي:</span>
                        <span style="float:left;color:#7c6d47;">{{ number_format((float) $order->total, 2) }} شيكل</span>
                    </div>
                </div>

                <div style="margin-bottom:22px;">
                    <table role="presentation" class="info-table" style="width:100%;border-collapse:separate;border-spacing:12px 0;">
                        <tr>
                            <td style="width:50%;vertical-align:top;">
                                <div style="background:#ffffff;border:1px solid #eadfce;border-radius:18px;padding:20px;text-align:center;height:100%;">
                                    <div style="font-size:28px;margin-bottom:8px;">📞</div>
                                    <div style="font-size:18px;font-weight:700;margin-bottom:8px;">تواصل معنا</div>
                                    <div style="font-size:14px;color:#6b7280;margin-bottom:12px;">لأي استفسارات حول طلبك</div>
                                    @if($headerPhone)
                                        <a href="tel:{{ preg_replace('/[^0-9+]/', '', $headerPhone) }}" style="color:#7c6d47;text-decoration:none;font-weight:700;" dir="ltr">{{ $headerPhone }}</a>
                                    @else
                                        <span style="color:#7c6d47;font-weight:700;">{{ $siteName }}</span>
                                    @endif
                                </div>
                            </td>
                            <td style="width:50%;vertical-align:top;">
                                <div style="background:#ffffff;border:1px solid #eadfce;border-radius:18px;padding:20px;text-align:center;height:100%;">
                                    <div style="font-size:28px;margin-bottom:8px;">📦</div>
                                    <div style="font-size:18px;font-weight:700;margin-bottom:8px;">تتبع الطلب</div>
                                    <div style="font-size:14px;color:#6b7280;margin-bottom:12px;">تابع حالة طلبك أول بأول</div>
                                    <a href="{{ $successUrl }}" target="_blank" style="color:#7c6d47;text-decoration:none;font-weight:700;">عرض صفحة الطلب</a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="text-align:center;margin-bottom:22px;">
                    <a href="{{ $frontendUrl }}/" target="_blank" class="action-link" style="display:inline-block;background:#ac9d7f;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:14px;font-weight:700;margin-left:8px;">
                        العودة للرئيسية
                    </a>
                    <a href="{{ $frontendUrl }}/products" target="_blank" class="action-link" style="display:inline-block;border:1px solid #ac9d7f;color:#7c6d47;text-decoration:none;padding:14px 24px;border-radius:14px;font-weight:700;">
                        متابعة التسوق
                    </a>
                </div>

                <div style="background:linear-gradient(135deg,#948563 0%,#c4b59b 100%);color:#ffffff;border-radius:18px;padding:22px;text-align:center;direction:rtl;">
                    <div style="font-size:22px;font-weight:700;margin-bottom:8px;">شكراً لثقتك بنا!</div>
                    <div style="font-size:14px;opacity:.96;">
                        {{ $recipientType === 'admin' ? 'هذه النسخة مخصصة لمتابعة الطلب من لوحة الإدارة.' : 'نقدّر اختيارك لمتجر روبيتا ونتطلع لخدمتك مرة أخرى.' }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
