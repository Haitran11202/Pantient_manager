import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ReloadOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { api, DebtDto, PaymentMethod } from '../api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PaymentFormValues {
  paymentDate: Dayjs;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

type PatientDebt = DebtDto;

export const DebtPaymentManagement: React.FC = () => {
  const [debts, setDebts] = useState<PatientDebt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDebt | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const paymentSubmitLockRef = useRef(false);
  const [form] = Form.useForm<PaymentFormValues>();

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await api.getDebts();
      setDebts(data);
    } catch (error) {
      message.error('Không tải được dữ liệu công nợ');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      cash: 'Tiền mặt',
      bank_transfer: 'Chuyển khoản',
      credit_card: 'Thẻ tín dụng',
    };
    return labels[method];
  };

  const handleReceivePayment = (patient: PatientDebt) => {
    paymentSubmitLockRef.current = false;
    setSelectedPatient(patient);
    setIsModalOpen(true);
    form.resetFields();
    form.setFieldsValue({
      paymentDate: dayjs(),
      amount: patient.remainingDebt,
      paymentMethod: 'cash',
    });
  };

  const handlePaymentSubmit = async () => {
    if (submittingPayment || paymentSubmitLockRef.current) {
      return;
    }

    try {
      paymentSubmitLockRef.current = true;
      setSubmittingPayment(true);
      message.open({
        key: 'payment-submit',
        type: 'loading',
        content: 'Đang ghi nhận thanh toán...',
        duration: 0,
      });

      const values = await form.validateFields();

      if (!selectedPatient) {
        message.destroy('payment-submit');
        return;
      }

      if (values.amount <= 0) {
        message.error('Số tiền thanh toán phải lớn hơn 0');
        return;
      }

      if (values.amount > selectedPatient.remainingDebt) {
        message.error('Số tiền thanh toán không được vượt quá công nợ còn lại');
        return;
      }

      await api.createPayment(selectedPatient.id, {
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
      });

      // Close immediately after successful payment to prevent re-submission.
      setIsModalOpen(false);
      setSelectedPatient(null);
      form.resetFields();

      message.open({
        key: 'payment-submit',
        type: 'success',
        content: `Đã ghi nhận thanh toán ${formatVND(values.amount)} thành công!`,
      });

      await loadDebts();
    } catch (error) {
      console.error('Payment submit failed:', error);
      message.open({
        key: 'payment-submit',
        type: 'error',
        content: 'Không thể ghi nhận thanh toán. Vui lòng thử lại.',
      });
    } finally {
      paymentSubmitLockRef.current = false;
      setSubmittingPayment(false);
    }
  };

  const statistics = useMemo(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingDebt, 0);
    const totalInvoiced = debts.reduce((sum, debt) => sum + debt.totalInvoiced, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + debt.totalPaid, 0);
    const patientsWithDebt = debts.filter((debt) => debt.remainingDebt > 0).length;

    return { totalDebt, totalInvoiced, totalPaid, patientsWithDebt };
  }, [debts]);

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
        <Text
          strong
          className={amount > 0 ? 'text-red-600 text-base' : 'text-gray-500 text-base'}
        >
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
          disabled={record.remainingDebt <= 0}
        >
          {record.remainingDebt > 0 ? 'Thu Tiền' : 'Đã Hết Nợ'}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <Title level={2}>Quản Lý Công Nợ & Thanh Toán</Title>
          <Text type="secondary">
            Theo dõi công nợ bệnh nhân và ghi nhận giao dịch thanh toán
          </Text>
        </div>

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

        <Card
          title="Danh Sách Công Nợ"
          className="shadow-sm"
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadDebts} loading={loading}>
              Làm Mới
            </Button>
          }
        >
          <Table
            loading={loading}
            columns={columns}
            dataSource={debts}
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
            if (submittingPayment) {
              return;
            }
            setIsModalOpen(false);
            setSelectedPatient(null);
            form.resetFields();
          }}
          okText="Ghi Nhận"
          cancelText="Hủy"
          width={600}
          confirmLoading={submittingPayment}
          maskClosable={!submittingPayment}
          keyboard={!submittingPayment}
          closable={!submittingPayment}
          okButtonProps={{ disabled: submittingPayment || !selectedPatient }}
          cancelButtonProps={{ disabled: submittingPayment }}
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

          {selectedPatient && selectedPatient.paymentHistory.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <Text strong className="block mb-3">
                Lịch Sử Thanh Toán ({selectedPatient.paymentHistory.length} giao dịch)
              </Text>
              <Space orientation="vertical" size="small" className="w-full">
                {selectedPatient.paymentHistory
                  .slice()
                  .reverse()
                  .map((payment) => (
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
