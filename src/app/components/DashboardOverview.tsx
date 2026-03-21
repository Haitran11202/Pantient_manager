import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Row, Space, Spin, Statistic, Typography, message } from 'antd';
import { CalendarOutlined, CreditCardOutlined, DollarOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, DashboardSummaryDto } from '../api/client';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export const DashboardOverview = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [reportRange, setReportRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSummary = async (date: Dayjs) => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary(date.format('YYYY-MM-DD'));
      setSummary(data);
    } catch (error) {
      message.error('Không tải được dữ liệu dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate]);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const fromDate = reportRange[0].format('YYYY-MM-DD');
      const toDate = reportRange[1].format('YYYY-MM-DD');

      const blob = await api.downloadRevenueReport(fromDate, toDate);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-doanh-thu-${fromDate}-den-${toDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('Đã xuất file Excel báo cáo doanh thu');
    } catch (error) {
      message.error('Xuất báo cáo thất bại');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const monthlyChartData = useMemo(() => {
    if (!summary) return [];
    return summary.monthlyRevenueByDay.map((item) => ({
      label: `${item.day}`,
      revenue: Number(item.revenue),
    }));
  }, [summary]);

  const yearlyChartData = useMemo(() => {
    if (!summary) return [];
    return summary.yearlyRevenueByMonth.map((item) => ({
      label: `T${item.month}`,
      revenue: Number(item.revenue),
    }));
  }, [summary]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
          <div>
            <Title level={2}>Dashboard Tổng Quan</Title>
            <Text type="secondary">Theo dõi doanh thu, công nợ và lịch hẹn theo ngày, tháng, năm</Text>
          </div>
          <Space direction="vertical" size="small" align="end">
            <Space>
              <Text strong>Chọn ngày:</Text>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                format="DD/MM/YYYY"
                allowClear={false}
                size="large"
              />
            </Space>
            <Space>
              <RangePicker
                value={reportRange}
                onChange={(values) => {
                  if (values?.[0] && values?.[1]) {
                    setReportRange([values[0], values[1]]);
                  }
                }}
                format="DD/MM/YYYY"
                allowClear={false}
                size="large"
              />
              <Button type="primary" icon={<FileExcelOutlined />} loading={exporting} onClick={handleExportExcel}>
                Xuất Excel
              </Button>
            </Space>
          </Space>
        </div>

        <Spin spinning={loading}>
          {summary && (
            <>
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Doanh Thu Ngày" value={summary.revenue.day} formatter={(v) => formatVND(Number(v))} prefix={<DollarOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Doanh Thu Tháng" value={summary.revenue.month} formatter={(v) => formatVND(Number(v))} prefix={<DollarOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Doanh Thu Năm" value={summary.revenue.year} formatter={(v) => formatVND(Number(v))} prefix={<DollarOutlined />} />
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Công Nợ Còn Lại" value={summary.debt.totalOutstanding} formatter={(v) => formatVND(Number(v))} prefix={<CreditCardOutlined />} valueStyle={{ color: '#ff4d4f' }} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Lịch Hẹn Trong Ngày" value={summary.appointments.day} prefix={<CalendarOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Lịch Hẹn Trong Tháng" value={summary.appointments.month} prefix={<CalendarOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Lịch Hẹn Trong Năm" value={summary.appointments.year} prefix={<CalendarOutlined />} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic title="Tổng Lịch Hẹn" value={summary.appointments.total} prefix={<CalendarOutlined />} />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title={`Biểu Đồ Doanh Thu Theo Ngày - ${selectedDate.format('MM/YYYY')}`}>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <LineChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}tr`} />
                          <Tooltip formatter={(value) => formatVND(Number(value))} />
                          <Line type="monotone" dataKey="revenue" stroke="#1677ff" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title={`Biểu Đồ Doanh Thu Theo Tháng - ${selectedDate.format('YYYY')}`}>
                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <LineChart data={yearlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}tr`} />
                          <Tooltip formatter={(value) => formatVND(Number(value))} />
                          <Line type="monotone" dataKey="revenue" stroke="#52c41a" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Spin>
      </div>
    </div>
  );
};
