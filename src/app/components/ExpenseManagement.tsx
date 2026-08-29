import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, FileExcelOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { api, ExpenseCategory, ExpenseDto } from '../api/client';

const { Title, Text } = Typography;

interface ExpenseManagementProps {
  category: ExpenseCategory;
  title: string;
  description: string;
  isActive: boolean;
}

interface ExpenseFormValues {
  quantity: number;
  name: string;
  unitPrice: number;
  createdDate: dayjs.Dayjs;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

export function ExpenseManagement({
  category,
  title,
  description,
  isActive,
}: ExpenseManagementProps) {
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState<dayjs.Dayjs | null>(null);
  const [exportToDate, setExportToDate] = useState<dayjs.Dayjs | null>(null);
  const [form] = Form.useForm<ExpenseFormValues>();

  const totalAmount = useMemo(
    () => expenses.reduce((total, expense) => total + expense.totalAmount, 0),
    [expenses]
  );

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setExpenses(await api.getExpenses(category));
    } catch (error) {
      message.error(`Không tải được ${title.toLowerCase()}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadExpenses();
    }
  }, [category, isActive]);

  const openCreateModal = () => {
    form.setFieldsValue({
      quantity: 1,
      name: '',
      unitPrice: 0,
      createdDate: dayjs(),
    });
    setIsModalOpen(true);
  };

  const saveExpense = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      await api.createExpense(category, {
        quantity: values.quantity,
        name: values.name.trim(),
        unitPrice: values.unitPrice,
        createdDate: values.createdDate.format('YYYY-MM-DD'),
      });

      message.success(`Đã thêm ${title.toLowerCase()}`);
      setIsModalOpen(false);
      form.resetFields();
      await loadExpenses();
    } catch (error) {
      if (error instanceof Error && !('errorFields' in error)) {
        message.error(`Không lưu được ${title.toLowerCase()}`);
        console.error(error);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(category, id);
      message.success('Đã xóa khoản chi');
      await loadExpenses();
    } catch (error) {
      message.error('Không xóa được khoản chi');
      console.error(error);
    }
  };

  const exportExcel = async () => {
    try {
      setExporting(true);
      const fromDate = exportFromDate?.format('YYYY-MM-DD');
      const toDate = exportToDate?.format('YYYY-MM-DD');
      const blob = await api.downloadExpenseReport(category, fromDate, toDate);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateSuffix = fromDate && toDate ? `-${fromDate}-${toDate}` : '';
      link.download = `${category === 'materials' ? 'chi-phi-vat-lieu' : 'chi-phi-khac'}${dateSuffix}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Không xuất được file Excel');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const columns: TableColumnsType<ExpenseDto> = [
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 140,
      sorter: (a, b) => a.createdDate.localeCompare(b.createdDate),
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 180,
      align: 'right',
      sorter: (a, b) => a.unitPrice - b.unitPrice,
      render: (amount: number) => formatVND(amount),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 200,
      align: 'right',
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (amount: number) => <Text strong className="text-blue-600">{formatVND(amount)}</Text>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, expense) => (
        <Popconfirm
          title="Xóa khoản chi?"
          description="Dữ liệu sau khi xóa không thể khôi phục."
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => deleteExpense(expense.id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <Title level={2} className="!mb-1">{title}</Title>
          <Text type="secondary">{description}</Text>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
            <div className="rounded-lg bg-blue-50 px-5 py-3">
              <Text type="secondary" className="block">Tổng giá</Text>
              <Text strong className="text-2xl text-blue-600">{formatVND(totalAmount)}</Text>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <div className="flex flex-col gap-1">
                <Text type="secondary">Khoảng ngày xuất Excel</Text>
                <DatePicker.RangePicker
                  value={exportFromDate && exportToDate ? [exportFromDate, exportToDate] : null}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                  allowClear
                  onChange={(dates) => {
                    setExportFromDate(dates?.[0] ?? null);
                    setExportToDate(dates?.[1] ?? null);
                  }}
                />
              </div>

              <Space wrap>
                <Button
                  icon={<FileExcelOutlined />}
                  size="large"
                  loading={exporting}
                  disabled={expenses.length === 0}
                  onClick={exportExcel}
                >
                  Xuất Excel
                </Button>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreateModal}>
                  Thêm khoản chi
                </Button>
              </Space>
            </div>
          </div>

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={expenses}
            bordered
            scroll={{ x: 850 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `${total} khoản chi`,
            }}
            summary={() => (
              <Table.Summary.Row className="bg-orange-50">
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Text strong>Tổng giá</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong className="text-orange-600">{formatVND(totalAmount)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
              </Table.Summary.Row>
            )}
          />
        </Card>

        <Modal
          title={`Thêm ${title.toLowerCase()}`}
          open={isModalOpen}
          confirmLoading={saving}
          okText="Lưu"
          cancelText="Hủy"
          onOk={saveExpense}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
          }}
        >
          <Form form={form} layout="vertical" requiredMark="optional">
            <Form.Item
              name="name"
              label="Tên"
              rules={[
                { required: true, message: 'Vui lòng nhập tên' },
                { max: 200, message: 'Tên không được quá 200 ký tự' },
              ]}
            >
              <Input placeholder="Nhập tên khoản chi" maxLength={200} showCount />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Số lượng"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="unitPrice"
              label="Giá"
              rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
            >
              <InputNumber
                min={0}
                precision={0}
                step={1000}
                addonAfter="VND"
                style={{ width: '100%' }}
                formatter={(value) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number((value ?? '0').replace(/\./g, ''))}
              />
            </Form.Item>

            <Form.Item
              name="createdDate"
              label="Ngày tạo"
              rules={[{ required: true, message: 'Vui lòng chọn ngày tạo' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
