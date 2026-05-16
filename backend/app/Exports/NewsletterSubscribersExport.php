<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class NewsletterSubscribersExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private readonly Collection $subscribers)
    {
    }

    public function collection(): Collection
    {
        return $this->subscribers;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Email',
            'Status',
            'Source',
            'Subscribed At',
            'Unsubscribed At',
            'Created At',
        ];
    }

    public function map($subscriber): array
    {
        return [
            $subscriber->id,
            $subscriber->email,
            $subscriber->status,
            $subscriber->source,
            optional($subscriber->subscribed_at)?->format('Y-m-d H:i:s'),
            optional($subscriber->unsubscribed_at)?->format('Y-m-d H:i:s'),
            optional($subscriber->created_at)?->format('Y-m-d H:i:s'),
        ];
    }
}
