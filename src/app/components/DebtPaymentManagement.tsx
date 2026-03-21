import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Input,
  Card,
  Typography,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Payment method type
type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card';

// Payment transaction interface
interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
}

// Patient debt interface
interface PatientDebt {
  id: string;
  patientName: string;
  phoneNumber: string;
  totalInvoiced: number;
  totalPaid: number;
  remainingDebt: number;
  paymentHistory: PaymentTransaction[];
}

// Payment form values
interface PaymentFormValues {
  paymentDate: Dayjs;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Mock data - Patients with debts and payment history
const INITIAL_DEBTS: PatientDebt[] = [
  {
    id: '1',
    patientName: 'Nguyễn Văn An',
    phoneNumber: '+84 901 234 567',
    totalInvoiced: 15000000,
    totalPaid: 10000000,
    remainingDebt: 5000000,
    paymentHistory: [
      {
        id: 'P1-1',
        date: '2026-02-15',
        amount: 5000000,
        method: 'bank_transfer',
        notes: 'Thanh toán đợt 1',
      },
      {
        id: 'P1-2',
        date: '2026-03-01',
        amount: 5000000,
        method: 'cash',
        notes: 'Thanh toán đợt 2',
      },
    ],
  },
  {
    id: '2',
    patientName: 'Trần Thị Bình',
    phoneNumber: '+84 902 345 678',
    totalInvoiced: 8000000,
    totalPaid: 3000000,
    remainingDebt: 5000000,
    paymentHistory: [
      {
        id: 'P2-1',
        date: '2026-02-20',
        amount: 3000000,
        method: 'credit_card',
        notes: 'Thanh toán ban đầu',
      },
    ],
  },
  {
    id: '3',
    patientName: 'Lê Minh Châu',
    phoneNumber: '+84 903 456 789',
    totalInvoiced: 25000000,
    totalPaid: 15000000,
    remainingDebt: 10000000,
    paymentHistory: [
      {
        id: 'P3-1',
        date: '2026-01-10',
        amount: 10000000,
        method: 'bank_transfer',
        notes: 'Thanh toán lần 1 - Niềng răng',
      },
      {
        id: 'P3-2',
        date: '2026-02-10',
        amount: 5000000,
        method: 'bank_transfer',
        notes: 'Thanh toán lần 2 - Niềng răng',
      },
    ],
  },
  {
    id: '4',
    patientName: 'Phạm Hoàng Dũng',
    phoneNumber: '+84 904 567 890',
    totalInvoiced: 20000000,
    totalPaid: 20000000,
    remainingDebt: 0,
    paymentHistory: [
      {
        id: 'P4-1',
        date: '2026-02-05',
        amount: 20000000,
        method: 'bank_transfer',
        notes: 'Thanh toán đầy đủ - Cấy ghép Implant',
      },
    ],
  },
  {
    id: '5',
    patientName: 'Võ Thị Hương',
    phoneNumber: '+84 905 678 901',
    totalInvoiced: 12000000,
    totalPaid: 6000000,
    remainingDebt: 6000000,
    paymentHistory: [
      {
        id: 'P5-1',
        date: '2026-02-25',
        amount: 6000000,
        method: 'cash',
        notes: 'Thanh toán 50% trước',
      },
    ],
  },
  {
    id: '6',
    patientName: 'Đỗ Văn Em',
    phoneNumber: '+84 906 789 012',
    totalInvoiced: 4500000,
    totalPaid: 1500000,
    remainingDebt: 3000000,
    paymentHistory: [
      {
        id: 'P6-1',
        date: '2026-03-05',
        amount: 1500000,
        method: 'cash',
        notes: 'Đặt cọc làm răng sứ',
      },
    ],
  },
  {
    id: '7',
    patientName: 'Hoàng Thị Giang',
    phoneNumber: '+84 907 890 123',
    totalInvoiced: 7500000,
    totalPaid: 2500000,
    remainingDebt: 5000000,
    paymentHistory: [
      {
        id: 'P7-1',
        date: '2026-02-28',
        amount: 2500000,
        method: 'credit_card',
        notes: 'Thanh toán một phần điều trị tủy',
      },
    ],
  },
  {
    id: '8',
    patientName: 'Bùi Minh Hoàng',
    phoneNumber: '+84 908 901 234',
    totalInvoiced: 3500000,
    totalPaid: 500000,
    remainingDebt: 3000000,
    paymentHistory: [
      {
        id: 'P8-1',
        date: '2026-03-08',
        amount: 500000,
        method: 'cash',
        notes: 'Thanh toán tạm ứng',
      },
    ],
  },
];

export const DebtPaymentManagement: React.FC = () => {
  const [debts, setDebts] = useState<PatientDebt[]>(INITIAL_DEBTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDebt | null>(null);
  const [form] = Form.useForm<PaymentFormValues>();

  // Format VND currency
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      cash: 'Tiền mặt',
      bank_transfer: 'Chuyển khoản',
      credit_card: 'Thẻ tín dụng',
    };
    return labels[method];
  };

  // Handle receive payment click
  const handleReceivePayment = (patient: PatientDebt) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
    form.resetFields();
    form.setFieldsValue({
      paymentDate: dayjs(),
      amount: patient.remainingDebt,
      paymentMethod: 'cash',
    });
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!selectedPatient) return;

      // Validate payment amount
      if (values.amount <= 0) {
        message.error('Số tiền thanh toán phải lớn hơn 0');
        return;
      }

      if (values.amount > selectedPatient.remainingDebt) {
        message.error('Số tiền thanh toán không được vượt quá công nợ còn lại');
        return;
      }

      // Create new payment transaction
      const newTransaction: PaymentTransaction = {
        id: `P${selectedPatient.id}-${selectedPatient.paymentHistory.length + 1}`,
        date: values.paymentDate.format('YYYY-MM-DD'),
        amount: values.amount,
        method: values.paymentMethod,
        notes: values.notes || '',
      };

      // Update debts
      const updatedDebts = debts.map((debt) => {
        if (debt.id === selectedPatient.id) {
          const newTotalPaid = debt.totalPaid + values.amount;
          const newRemainingDebt = debt.totalInvoiced - newTotalPaid;
          
          return {
            ...debt,
            totalPaid: newTotalPaid,
            remainingDebt: newRemainingDebt,
            paymentHistory: [...debt.paymentHistory, newTransaction],
          };
        }
        return debt;
      });

      setDebts(updatedDebts);
      setIsModalOpen(false);
      setSelectedPatient(null);
      form.resetFields();
      
      message.success(`Đã ghi nhận thanh toán ${formatVND(values.amount)} thành công!`);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingDebt, 0);
    const totalInvoiced = debts.reduce((sum, debt) => sum + debt.totalInvoiced, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + debt.totalPaid, 0);
    const patientsWithDebt = debts.filter((debt) => debt.remainingDebt > 0).length;
    
    return { totalDebt, totalInvoiced, totalPaid, patientsWithDebt };
  }, [debts]);

  // Filter only patients with outstanding debt
  const patientsWithDebt = debts.filter((debt) => debt.remainingDebt > 0);

  // Table columns
  const columns: TableColumnsType<PatientDebt> = [
    {
      title: 'Tên Bệnh Nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 200,
      sorter: (a, b) => a.patientName.localeCompare(b.patientName),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Số Điện Thoại',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: 'Tổng Hóa Đơn',
      dataIndex: 'totalInvoiced',
      key: 'totalInvoiced',
      width: 180,
      sorter: (a, b) => a.totalInvoiced - b.totalInvoiced,
      render: (amount: number) => (
        <Text className="text-blue-600">{formatVND(amount)}</Text>
      ),
    },
    {
      title: 'Đã Thanh Toán',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      width: 180,
      sorter: (a, b) => a.totalPaid - b.totalPaid,
      render: (amount: number) => (
        <Text className="text-green-600">{formatVND(amount)}</Text>
      ),
    },
    {
      title: 'Công Nợ Còn Lại',
      dataIndex: 'remainingDebt',
      key: 'remainingDebt',
      width: 180,
      sorter: (a, b) => a.remainingDebt - b.remainingDebt,
      render: (amount: number) => (
        <Text strong className="text-red-600 text-base">
          {formatVND(amount)}
        </Text>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record: PatientDebt) => (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          onClick={() => handleReceivePayment(record)}
        >
          Thu Tiền
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Title level={2}>Quản Lý Công Nợ & Thanh Toán</Title>
          <Text type="secondary">
            Theo dõi công nợ bệnh nhân và ghi nhận giao dịch thanh toán
          </Text>
        </div>

        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng Công Nợ"
                value={statistics.totalDebt}
                formatter={(value) => formatVND(Number(value))}
                prefix={<DollarOutlined />}
                styles={{ content: { color: '#ff4d4f' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng Hóa Đơn"
                value={statistics.totalInvoiced}
                formatter={(value) => formatVND(Number(value))}
                prefix={<CreditCardOutlined />}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đã Thu"
                value={statistics.totalPaid}
                formatter={(value) => formatVND(Number(value))}
                prefix={<CreditCardOutlined />}
                styles={{ content: { color: '#52c41a' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Bệnh Nhân Còn Nợ"
                value={statistics.patientsWithDebt}
                suffix={`/ ${debts.length}`}
                prefix={<HistoryOutlined />}
                styles={{ content: { color: '#faad14' } }}
              />
            </Card>
          </Col>
        </Row>

        {/* Debt List Table */}
        <Card title="Danh Sách Công Nợ" className="shadow-sm">
          <Table
            columns={columns}
            dataSource={patientsWithDebt}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} bệnh nhân`,
              pageSizeOptions: ['10', '20', '50'],
            }}
            scroll={{ x: 1000 }}
            bordered
          />
        </Card>

        {/* Payment Modal */}
        <Modal
          title={
            <Space>
              <DollarOutlined className="text-blue-600" />
              <span>Ghi Nhận Thanh Toán</span>
            </Space>
          }
          open={isModalOpen}
          onOk={handlePaymentSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedPatient(null);
            form.resetFields();
          }}
          okText="Ghi Nhận"
          cancelText="Hủy"
          width={600}
          destroyOnHidden
        >
          {selectedPatient && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <Space orientation="vertical" size={4} className="w-full">
                <div key="patient-info" className="flex justify-between">
                  <Text strong>Bệnh nhân:</Text>
                  <Text>{selectedPatient.patientName}</Text>
                </div>
                <div key="patient-phone" className="flex justify-between">
                  <Text strong>Số điện thoại:</Text>
                  <Text>{selectedPatient.phoneNumber}</Text>
                </div>
                <div key="total-invoiced" className="flex justify-between">
                  <Text strong>Tổng hóa đơn:</Text>
                  <Text className="text-blue-600">
                    {formatVND(selectedPatient.totalInvoiced)}
                  </Text>
                </div>
                <div key="total-paid" className="flex justify-between">
                  <Text strong>Đã thanh toán:</Text>
                  <Text className="text-green-600">
                    {formatVND(selectedPatient.totalPaid)}
                  </Text>
                </div>
                <div key="remaining-debt" className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                  <Text strong className="text-base">
                    Công nợ còn lại:
                  </Text>
                  <Text strong className="text-red-600 text-base">
                    {formatVND(selectedPatient.remainingDebt)}
                  </Text>
                </div>
              </Space>
            </div>
          )}

          <Form form={form} layout="vertical">
            <Form.Item
              name="paymentDate"
              label="Ngày Thanh Toán"
              rules={[{ required: true, message: 'Vui lòng chọn ngày thanh toán' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày thanh toán"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Số Tiền Thanh Toán"
              rules={[
                { required: true, message: 'Vui lòng nhập số tiền thanh toán' },
                {
                  validator: (_, value) => {
                    if (value <= 0) {
                      return Promise.reject('Số tiền phải lớn hơn 0');
                    }
                    if (selectedPatient && value > selectedPatient.remainingDebt) {
                      return Promise.reject(
                        `Số tiền không được vượt quá công nợ còn lại (${formatVND(
                          selectedPatient.remainingDebt
                        )})`
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập số tiền"
                size="large"
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value!.replace(/,/g, '')}
                addonAfter="VND"
              />
            </Form.Item>

            <Form.Item
              name="paymentMethod"
              label="Phương Thức Thanh Toán"
              rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
            >
              <Select
                size="large"
                placeholder="Chọn phương thức thanh toán"
                options={[
                  { label: 'Tiền mặt (Cash)', value: 'cash' },
                  { label: 'Chuyển khoản (Bank Transfer)', value: 'bank_transfer' },
                  { label: 'Thẻ tín dụng (Credit Card)', value: 'credit_card' },
                ]}
              />
            </Form.Item>

            <Form.Item name="notes" label="Ghi Chú">
              <TextArea
                rows={3}
                placeholder="Nhập ghi chú thanh toán (tùy chọn)"
                maxLength={200}
                showCount
              />
            </Form.Item>
          </Form>

          {/* Payment History */}
          {selectedPatient && selectedPatient.paymentHistory.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <Text strong className="block mb-3">
                Lịch Sử Thanh Toán ({selectedPatient.paymentHistory.length} giao dịch)
              </Text>
              <Space orientation="vertical" size="small" className="w-full">
                {selectedPatient.paymentHistory
                  .slice()
                  .reverse()
                  .map((payment, index) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <Text className="block">
                          {dayjs(payment.date).format('DD/MM/YYYY')} -{' '}
                          <Tag color="blue">{getPaymentMethodLabel(payment.method)}</Tag>
                        </Text>
                        {payment.notes && (
                          <Text type="secondary" className="text-sm">
                            {payment.notes}
                          </Text>
                        )}
                      </div>
                      <Text strong className="text-green-600">
                        {formatVND(payment.amount)}
                      </Text>
                    </div>
                  ))}
              </Space>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};