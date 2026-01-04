import * as XLSX from 'xlsx';

export interface ExportRecord {
  借用人: string;
  案場名稱: string;
  工具ID: number;
  數量: number;
  借用時間: string;
  預計歸還: string;
  狀態: string;
  備註: string;
}

/**
 * 將借用記錄匯出為Excel檔案
 */
export function exportBorrowRecordsToExcel(
  records: ExportRecord[],
  filename: string = '借用記錄.xlsx'
) {
  // 建立工作簿
  const workbook = XLSX.utils.book_new();

  // 將數據轉換為工作表
  const worksheet = XLSX.utils.json_to_sheet(records, {
    header: ['借用人', '案場名稱', '工具ID', '數量', '借用時間', '預計歸還', '狀態', '備註'],
  });

  // 設定列寬
  const columnWidths = [
    { wch: 12 }, // 借用人
    { wch: 20 }, // 案場名稱
    { wch: 10 }, // 工具ID
    { wch: 8 },  // 數量
    { wch: 18 }, // 借用時間
    { wch: 18 }, // 預計歸還
    { wch: 10 }, // 狀態
    { wch: 20 }, // 備註
  ];
  worksheet['!cols'] = columnWidths;

  // 設定標題行樣式
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  // 應用標題樣式
  for (let i = 0; i < 8; i++) {
    const cellAddress = XLSX.utils.encode_col(i) + '1';
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = headerStyle;
    }
  }

  // 新增工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '借用記錄');

  // 匯出檔案
  XLSX.writeFile(workbook, filename);
}

/**
 * 生成帶有時間戳的檔案名稱
 */
export function generateExcelFilename(projectName?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const name = projectName ? `${projectName}_` : '';
  return `${name}借用記錄_${timestamp}.xlsx`;
}
