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

class OrdersExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithDrawings, WithCustomStartCell, WithEvents
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
            // DB value starts with /storage/...
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
            $drawing->setDescription('Ropita Logo');
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
            'المنتجات',
            'العناصر المباعة',
            'صافي المبيعات',
        ];
    }

    public function map($order): array
    {
        $productsList = $order->items->map(function ($item) {
            return $item->quantity . 'x ' . $item->product_name;
        })->implode("\n");

        return [
            $order->created_at->format('d/m/Y'),
            $productsList,
            $order->items->sum('quantity'),
            (float) $order->total,
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 60,
            'C' => 18,
            'D' => 18,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Set RTL
        $sheet->setRightToLeft(true);

        // Merge cells for the logo area
        $sheet->mergeCells('A1:D8');
        
        // Optional: add a light border or white background to the merged logo area
        $sheet->getStyle('A1:D8')->applyFromArray([
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'color' => ['rgb' => 'FFFFFF'],
            ],
        ]);

        $lastRow = $sheet->getHighestRow();

        // Style headings (Row 9)
        $sheet->getStyle('A9:D9')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => '000000'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'color' => ['rgb' => 'C4B59B'], // Brand color
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
            $sheet->getStyle('A10:D' . $lastRow)->applyFromArray([
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
            ]);
            
            // Products column align right
            $sheet->getStyle('B10:B' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            
            // Format number columns
            $sheet->getStyle('C10:C' . $lastRow)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('D10:D' . $lastRow)->getNumberFormat()->setFormatCode('#,##0.00');
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
                
                // Add "Total" text
                $sheet->setCellValue('B' . $totalRow, 'الإجمالي');
                
                // Formulas for summation
                // Column C: Sold Items, Column D: Net Sales
                if ($lastRow >= 10) {
                    $sheet->setCellValue('C' . $totalRow, '=SUM(C10:C' . $lastRow . ')');
                    $sheet->setCellValue('D' . $totalRow, '=SUM(D10:D' . $lastRow . ')');
                    
                    // Format totals
                    $sheet->getStyle('C' . $totalRow)->getNumberFormat()->setFormatCode('#,##0');
                    $sheet->getStyle('D' . $totalRow)->getNumberFormat()->setFormatCode('#,##0.00');
                } else {
                    $sheet->setCellValue('C' . $totalRow, '0');
                    $sheet->setCellValue('D' . $totalRow, '0.00');
                }
                
                // Style the total row
                $sheet->getStyle('A' . $totalRow . ':D' . $totalRow)->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                    ],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'color' => ['rgb' => 'C4B59B'], // Brand color
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
