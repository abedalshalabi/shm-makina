<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class DetailedOrdersExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithDrawings, WithCustomStartCell, WithEvents
{
    use Exportable;

    protected $query;

    public function __construct($query)
    {
        $this->query = $query;
    }

    public function query()
    {
        return $this->query;
    }

    public function startCell(): string
    {
        return 'A9';
    }

    public function drawings()
    {
        $drawings = [];
        
        $logoPath = public_path('logo.webp');
        
        // Try to get logo from SiteSettings
        $settingLogo = \App\Models\SiteSetting::where('key', 'header_logo')->first();
        if ($settingLogo && !empty($settingLogo->value)) {
            $path = public_path($settingLogo->value);
            if (file_exists($path)) {
                $logoPath = $path;
            }
        } else if (!file_exists($logoPath)) {
            $logoPath = public_path('logo.png');
        }

        if (file_exists($logoPath)) {
            $drawing = new Drawing();
            $drawing->setName('Logo');
            $drawing->setDescription('Logo');
            $drawing->setPath($logoPath);
            $drawing->setHeight(100);
            $drawing->setCoordinates('B2');
            $drawing->setOffsetX(50);
            $drawings[] = $drawing;
        }

        return $drawings;
    }

    public function headings(): array
    {
        return [
            'التاريخ',
            'رقم الطلب',
            'الزبون',
            'الهاتف',
            'الإيميل',
            'العنوان',
            'المنتجات (الاسم + SKU)',
            'الكمية الإجمالية',
            'إجمالي الطلب',
            'الحالة',
        ];
    }

    public function map($order): array
    {
        $productsList = $order->items->map(function ($item) {
            $sku = $item->product_sku ? " [{$item->product_sku}]" : "";
            return $item->quantity . 'x ' . $item->product_name . $sku;
        })->implode("\n");

        $address = implode(", ", array_filter([
            $order->customer_city,
            $order->customer_district,
            $order->customer_street,
            $order->customer_building
        ]));

        $statusMap = [
            'pending' => 'قيد الانتظار',
            'processing' => 'قيد التنفيذ',
            'shipped' => 'تم الشحن',
            'delivered' => 'تم التوصيل',
            'cancelled' => 'ملغي',
            'returned' => 'مرتجع',
        ];

        return [
            $order->created_at->format('d/m/Y'),
            $order->order_number,
            $order->customer_name,
            $order->customer_phone,
            $order->customer_email,
            $address,
            $productsList,
            $order->items->sum('quantity'),
            (float) $order->total,
            $statusMap[$order->order_status] ?? $order->order_status,
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 20,
            'C' => 25,
            'D' => 15,
            'E' => 25,
            'F' => 35,
            'G' => 45,
            'H' => 15,
            'I' => 15,
            'J' => 15,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->setRightToLeft(true);

        // Merge cells for the logo area
        $sheet->mergeCells('A1:J8');
        
        $sheet->getStyle('A1:J8')->applyFromArray([
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'color' => ['rgb' => 'FFFFFF'],
            ],
        ]);

        $lastRow = $sheet->getHighestRow();

        // Style headings (Row 9)
        $sheet->getStyle('A9:J9')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => '000000'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'color' => ['rgb' => 'C4B59B'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);

        // Style the data rows
        if ($lastRow > 9) {
            $sheet->getStyle('A10:J' . $lastRow)->applyFromArray([
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'E2E8F0'],
                    ],
                ],
            ]);
            
            // Products column align right
            $sheet->getStyle('G10:G' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            
            // Format number columns
            $sheet->getStyle('H10:H' . $lastRow)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('I10:I' . $lastRow)->getNumberFormat()->setFormatCode('#,##0.00');
        }

        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $totalRow = $lastRow + 1;
                
                $sheet->setCellValue('F' . $totalRow, 'إجمالي التقرير');
                
                if ($lastRow >= 10) {
                    $sheet->setCellValue('H' . $totalRow, '=SUM(H10:H' . $lastRow . ')');
                    $sheet->setCellValue('I' . $totalRow, '=SUM(I10:I' . $lastRow . ')');
                    
                    $sheet->getStyle('H' . $totalRow)->getNumberFormat()->setFormatCode('#,##0');
                    $sheet->getStyle('I' . $totalRow)->getNumberFormat()->setFormatCode('#,##0.00');
                }
                
                $sheet->getStyle('A' . $totalRow . ':J' . $totalRow)->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                    ],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'color' => ['rgb' => 'C4B59B'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                        ],
                    ],
                ]);
            },
        ];
    }
}
