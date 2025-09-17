/**
 * @fileoverview Excel Export Service
 * @created 2025-01-15
 * @file excelExport.service.js
 * @description Service for exporting potential orders to Excel format
 */

import XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import logger from '../utils/logger.js';

class ExcelExportService {
  /**
   * Export potential orders to Excel format
   * @param {Array} orders - Array of potential orders
   * @param {Object} options - Export options
   * @returns {Buffer} Excel file buffer
   */
  async exportPotentialOrders(orders, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Potential Orders');

      // Define columns
      const columns = [
        { header: 'No.', key: 'index', width: 8 },
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Phone Number', key: 'phoneNumber', width: 15 },
        { header: 'Product', key: 'productName', width: 30 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Size', key: 'size', width: 12 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Original Message', key: 'originalMessage', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Livestream', key: 'streamTitle', width: 25 },
        { header: 'Created At', key: 'createdAt', width: 20 },
        { header: 'Notes', key: 'notes', width: 30 },
        { header: 'Real Order ID', key: 'convertedOrderId', width: 20 },
      ];

      worksheet.columns = columns;

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' },
      };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Add data rows
      orders.forEach((order, index) => {
        const row = {
          index: index + 1,
          orderId: order._id.toString().slice(-8),
          customerName: order.customerInfo?.customerName || 'N/A',
          phoneNumber: order.customerInfo?.phoneNumber || 'N/A',
          productName: order.productInfo?.productId?.name || 'Unknown',
          sku: order.productInfo?.productId?.sku || 'N/A',
          quantity: order.productInfo?.extractedQuantity || 1,
          size: order.productInfo?.extractedSize || 'N/A',
          color: order.productInfo?.extractedColor || 'N/A',
          originalMessage: order.productInfo?.originalMessage || 'N/A',
          status: this.getStatusText(order.status),
          priority: this.getPriorityText(order.priority),
          streamTitle: order.streamId?.title || 'N/A',
          createdAt: new Date(order.createdAt).toLocaleString('en-US'),
          notes: order.hostActions?.notes || '',
          convertedOrderId: order.convertedOrderId
            ? order.convertedOrderId.toString().slice(-8)
            : 'Not converted',
        };

        worksheet.addRow(row);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = Math.max(column.width, 10);
      });

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Add summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      this.addSummarySheet(summarySheet, orders);

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      logger.error('Error exporting potential orders to Excel:', error);
      throw error;
    }
  }

  /**
   * Add summary sheet with statistics
   * @param {Object} worksheet - Excel worksheet
   * @param {Array} orders - Array of potential orders
   */
  addSummarySheet(worksheet, orders) {
    // Summary data
    const totalOrders = orders.length;
    const statusCounts = this.getStatusCounts(orders);
    const priorityCounts = this.getPriorityCounts(orders);
    const streamCounts = this.getStreamCounts(orders);

    // Title
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'POTENTIAL ORDERS REPORT';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Summary section
    let row = 3;
    worksheet.getCell(`A${row}`).value = 'OVERVIEW';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    row += 2;

    worksheet.getCell(`A${row}`).value = 'Total Orders:';
    worksheet.getCell(`B${row}`).value = totalOrders;
    row++;

    worksheet.getCell(`A${row}`).value = 'Export Date:';
    worksheet.getCell(`B${row}`).value = new Date().toLocaleString('en-US');
    row += 2;

    // Status breakdown
    worksheet.getCell(`A${row}`).value = 'STATUS BREAKDOWN';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    row += 2;

    Object.entries(statusCounts).forEach(([status, count]) => {
      worksheet.getCell(`A${row}`).value = this.getStatusText(status) + ':';
      worksheet.getCell(`B${row}`).value = count;
      row++;
    });

    row += 1;

    // Priority breakdown
    worksheet.getCell(`A${row}`).value = 'PRIORITY BREAKDOWN';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    row += 2;

    Object.entries(priorityCounts).forEach(([priority, count]) => {
      worksheet.getCell(`A${row}`).value = this.getPriorityText(priority) + ':';
      worksheet.getCell(`B${row}`).value = count;
      row++;
    });

    row += 1;

    // Stream breakdown
    worksheet.getCell(`A${row}`).value = 'LIVESTREAM BREAKDOWN';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    row += 2;

    Object.entries(streamCounts).forEach(([streamTitle, count]) => {
      worksheet.getCell(`A${row}`).value = streamTitle + ':';
      worksheet.getCell(`B${row}`).value = count;
      row++;
    });

    // Auto-fit columns
    worksheet.columns = [{ width: 30 }, { width: 15 }];
  }

  /**
   * Get status counts
   * @param {Array} orders - Array of potential orders
   * @returns {Object} Status counts
   */
  getStatusCounts(orders) {
    const counts = {};
    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get priority counts
   * @param {Array} orders - Array of potential orders
   * @returns {Object} Priority counts
   */
  getPriorityCounts(orders) {
    const counts = {};
    orders.forEach(order => {
      counts[order.priority] = (counts[order.priority] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get stream counts
   * @param {Array} orders - Array of potential orders
   * @returns {Object} Stream counts
   */
  getStreamCounts(orders) {
    const counts = {};
    orders.forEach(order => {
      const streamTitle = order.streamId?.title || 'Unknown';
      counts[streamTitle] = (counts[streamTitle] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get English status text
   * @param {String} status - Status code
   * @returns {String} English status text
   */
  getStatusText(status) {
    const statusMap = {
      pending: 'Pending',
      contacted: 'Contacted',
      confirmed: 'Confirmed',
      converted: 'Converted',
      ignored: 'Ignored',
      spam: 'Spam',
    };
    return statusMap[status] || status;
  }

  /**
   * Get English priority text
   * @param {String} priority - Priority code
   * @returns {String} English priority text
   */
  getPriorityText(priority) {
    const priorityMap = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    };
    return priorityMap[priority] || priority;
  }

  /**
   * Export potential orders with filters to Excel
   * @param {Array} orders - Array of potential orders
   * @param {Object} filters - Applied filters
   * @returns {Buffer} Excel file buffer
   */
  async exportWithFilters(orders, filters) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Potential Orders');

      // Add filter info at the top
      let row = 1;
      worksheet.getCell(`A${row}`).value = 'POTENTIAL ORDERS REPORT';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 16 };
      worksheet.mergeCells(`A${row}:P${row}`);
      row += 2;

      // Add filter information
      if (filters.status && filters.status !== 'all') {
        worksheet.getCell(`A${row}`).value = 'Status:';
        worksheet.getCell(`B${row}`).value = this.getStatusText(filters.status);
        row++;
      }

      if (filters.priority && filters.priority !== 'all') {
        worksheet.getCell(`A${row}`).value = 'Priority:';
        worksheet.getCell(`B${row}`).value = this.getPriorityText(filters.priority);
        row++;
      }

      if (filters.searchText) {
        worksheet.getCell(`A${row}`).value = 'Search:';
        worksheet.getCell(`B${row}`).value = filters.searchText;
        row++;
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        worksheet.getCell(`A${row}`).value = 'Date Range:';
        worksheet.getCell(`B${row}`).value = `${filters.dateRange[0]} - ${filters.dateRange[1]}`;
        row++;
      }

      row += 2;

      // Define columns starting from the current row
      const columns = [
        { header: 'No.', key: 'index', width: 8 },
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Phone Number', key: 'phoneNumber', width: 15 },
        { header: 'Product', key: 'productName', width: 30 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Size', key: 'size', width: 12 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Original Message', key: 'originalMessage', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Priority', key: 'priority', width: 15 },
        { header: 'Livestream', key: 'streamTitle', width: 25 },
        { header: 'Created At', key: 'createdAt', width: 20 },
        { header: 'Notes', key: 'notes', width: 30 },
        { header: 'Real Order ID', key: 'convertedOrderId', width: 20 },
      ];

      // Add column headers
      columns.forEach((col, index) => {
        const cell = worksheet.getCell(row, index + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '366092' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      row++;

      // Add data rows
      orders.forEach((order, index) => {
        const rowData = {
          index: index + 1,
          orderId: order._id.toString().slice(-8),
          customerName: order.customerInfo?.customerName || 'N/A',
          phoneNumber: order.customerInfo?.phoneNumber || 'N/A',
          productName: order.productInfo?.productId?.name || 'Unknown',
          sku: order.productInfo?.productId?.sku || 'N/A',
          quantity: order.productInfo?.extractedQuantity || 1,
          size: order.productInfo?.extractedSize || 'N/A',
          color: order.productInfo?.extractedColor || 'N/A',
          originalMessage: order.productInfo?.originalMessage || 'N/A',
          status: this.getStatusText(order.status),
          priority: this.getPriorityText(order.priority),
          streamTitle: order.streamId?.title || 'N/A',
          createdAt: new Date(order.createdAt).toLocaleString('en-US'),
          notes: order.hostActions?.notes || '',
          convertedOrderId: order.convertedOrderId
            ? order.convertedOrderId.toString().slice(-8)
            : 'Not converted',
        };

        columns.forEach((col, colIndex) => {
          const cell = worksheet.getCell(row, colIndex + 1);
          cell.value = rowData[col.key];
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        row++;
      });

      // Auto-fit columns
      columns.forEach((col, index) => {
        worksheet.getColumn(index + 1).width = Math.max(col.width, 10);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      logger.error('Error exporting potential orders with filters to Excel:', error);
      throw error;
    }
  }
}

export default new ExcelExportService();
