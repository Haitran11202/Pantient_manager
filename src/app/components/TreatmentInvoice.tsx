import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  InputNumber,
  Input,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  Modal,
  Form,
  Popconfirm,
  message,
  Empty,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  SaveOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, InvoiceDto, ServiceDto, PatientDto } from '../api/client';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ServiceItem {
  id: string;
  name: string;
  unitPrice: number;
}

interface ServiceRow {
  key: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
}

interface PatientInfo {
  id: string;
  name: string;
  phone: string;
}

type Invoice = InvoiceDto;

interface TreatmentInvoiceProps {
  isActive: boolean;
}

const DISCOUNT_PERCENTAGES = Array.from({ length: 11 }, (_, index) => index * 10);

const getDiscountPercent = (discountPercent?: number): number => {
  if (typeof discountPercent !== 'number') {
    return 0;
  }

  return DISCOUNT_PERCENTAGES.includes(discountPercent) ? discountPercent : 0;
};

const calculateGrossAmount = (quantity: number, unitPrice: number): number => quantity * unitPrice;

const calculateDiscountAmount = (
  quantity: number,
  unitPrice: number,
  discountPercent = 0
): number => {
  const grossAmount = calculateGrossAmount(quantity, unitPrice);
  return Math.round((grossAmount * getDiscountPercent(discountPercent)) / 100);
};

const calculateSubtotal = (
  quantity: number,
  unitPrice: number,
  discountPercent = 0
): number => calculateGrossAmount(quantity, unitPrice) - calculateDiscountAmount(quantity, unitPrice, discountPercent);

const isStoredSubtotal = (subtotal?: number): subtotal is number =>
  typeof subtotal === 'number' && Number.isFinite(subtotal);

const inferDiscountPercentFromSubtotal = (
  quantity: number,
  unitPrice: number,
  subtotal?: number
): number => {
  if (!isStoredSubtotal(subtotal)) {
    return 0;
  }

  const matchedDiscount = DISCOUNT_PERCENTAGES.find(
    (discountPercent) => calculateSubtotal(quantity, unitPrice, discountPercent) === subtotal
  );

  return matchedDiscount ?? 0;
};

const resolveServiceSubtotal = ({
  quantity,
  unitPrice,
  discountPercent,
  subtotal,
}: {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  subtotal?: number;
}): number => {
  if (typeof discountPercent === 'number' && DISCOUNT_PERCENTAGES.includes(discountPercent)) {
    return calculateSubtotal(quantity, unitPrice, discountPercent);
  }

  if (isStoredSubtotal(subtotal)) {
    return subtotal;
  }

  return calculateSubtotal(quantity, unitPrice, 0);
};

const createEmptyServiceRow = (key: string): ServiceRow => ({
  key,
  serviceId: '',
  serviceName: '',
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  subtotal: 0,
});

const normalizeServiceRows = (rows: Partial<ServiceRow>[]): ServiceRow[] => {
  if (rows.length === 0) {
    return [createEmptyServiceRow('1')];
  }

  return rows.map((row, index) => {
    const quantity = typeof row.quantity === 'number' && row.quantity > 0 ? row.quantity : 1;
    const unitPrice = typeof row.unitPrice === 'number' ? row.unitPrice : 0;
    const hasExplicitDiscount =
      typeof row.discountPercent === 'number' && DISCOUNT_PERCENTAGES.includes(row.discountPercent);
    const subtotal = resolveServiceSubtotal({
      quantity,
      unitPrice,
      discountPercent: row.discountPercent,
      subtotal: row.subtotal,
    });
    const discountPercent = hasExplicitDiscount
      ? getDiscountPercent(row.discountPercent)
      : inferDiscountPercentFromSubtotal(quantity, unitPrice, subtotal);

    return {
      key: row.key || `${row.serviceId || 'service'}-${index + 1}`,
      serviceId: row.serviceId || '',
      serviceName: row.serviceName || '',
      quantity,
      unitPrice,
      discountPercent,
      subtotal,
    };
  });
};

const calculateServicesTotal = (
  rows: Array<Pick<ServiceRow, 'quantity' | 'unitPrice'> & { discountPercent?: number; subtotal?: number }>
): number =>
  rows.reduce(
    (sum, row) =>
      sum +
      resolveServiceSubtotal({
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        discountPercent: row.discountPercent,
        subtotal: row.subtotal,
      }),
    0
  );

export const TreatmentInvoice: React.FC<TreatmentInvoiceProps> = ({ isActive }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [form] = Form.useForm();

  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([createEmptyServiceRow('1')]);
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [existingDebt, setExistingDebt] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoiceData, serviceData] = await Promise.all([api.getInvoices(), api.getServices()]);

      setInvoices(invoiceData);
      setServiceCatalog(
        serviceData.map((s: ServiceDto) => ({ id: s.serviceId, name: s.serviceName, unitPrice: s.unitPrice }))
      );
    } catch (error) {
      message.error('Không tải được dữ liệu hóa đơn');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPatients = async () => {
    try {
      setLoadingPatients(true);
      const patientData = await api.getPatients();
      const mappedPatients = patientData.map((patient: PatientDto) => ({
        id: patient.id,
        name: patient.fullName,
        phone: patient.phoneNumber,
      }));
      setPatients(mappedPatients);
      return mappedPatients;
    } catch (error) {
      message.error('Không tải được danh sách bệnh nhân');
      console.error(error);
      return null;
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (!isActive) {
      return;
    }

    loadData();
  }, [isActive]);

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }

    const nextSelected = patients.find((patient) => patient.id === selectedPatient.id);
    if (!nextSelected) {
      return;
    }

    if (
      nextSelected.name !== selectedPatient.name ||
      nextSelected.phone !== selectedPatient.phone
    ) {
      setSelectedPatient(nextSelected);
    }
  }, [patients, selectedPatient, form]);

  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusTag = (status: Invoice['status']) => {
    switch (status) {
      case 'completed':
        return <Tag color="success">Hoàn thành</Tag>;
      case 'draft':
        return <Tag color="warning">Nháp</Tag>;
      case 'cancelled':
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
    }
  };

  const handleNewInvoice = async () => {
    await refreshPatients();
    setEditingInvoice(null);
    setIsViewMode(false);
    setSelectedPatient(null);
    setServiceRows([createEmptyServiceRow('1')]);
    setDoctorNotes('');
    setExistingDebt(0);
    setAmountPaid(0);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    const latestPatients = await refreshPatients();
    const selected =
      latestPatients?.find((patient) => patient.id === invoice.patient.id) ?? invoice.patient;

    setEditingInvoice(invoice);
    setIsViewMode(false);
    setSelectedPatient(selected);
    setServiceRows(normalizeServiceRows(invoice.services));
    setDoctorNotes(invoice.doctorNotes);
    setExistingDebt(invoice.existingDebt);
    setAmountPaid(invoice.amountPaid);
    form.setFieldsValue({
      patientId: selected.id,
      existingDebt: invoice.existingDebt,
      amountPaid: invoice.amountPaid,
    });
    setIsModalOpen(true);
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    const latestPatients = await refreshPatients();
    const selected =
      latestPatients?.find((patient) => patient.id === invoice.patient.id) ?? invoice.patient;

    setEditingInvoice(invoice);
    setIsViewMode(true);
    setSelectedPatient(selected);
    setServiceRows(normalizeServiceRows(invoice.services));
    setDoctorNotes(invoice.doctorNotes);
    setExistingDebt(invoice.existingDebt);
    setAmountPaid(invoice.amountPaid);
    form.setFieldsValue({
      patientId: selected.id,
      existingDebt: invoice.existingDebt,
      amountPaid: invoice.amountPaid,
    });
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      await api.deleteInvoice(invoiceId);
      message.success('Đã xóa hóa đơn thành công!');
      await loadData();
    } catch (error) {
      message.error('Không xóa được hóa đơn');
      console.error(error);
    }
  };

  const handleAddRow = () => {
    const newRow = createEmptyServiceRow(Date.now().toString());
    setServiceRows([...serviceRows, newRow]);
  };

  const handleDeleteRow = (key: string) => {
    setServiceRows(serviceRows.filter((row) => row.key !== key));
  };

  const handleServiceChange = (key: string, serviceId: string) => {
    const service = serviceCatalog.find((s) => s.id === serviceId);
    if (service) {
      const updatedRows = serviceRows.map((row) =>
        row.key === key
          ? {
              ...row,
              serviceId: service.id,
              serviceName: service.name,
              unitPrice: service.unitPrice,
              subtotal: calculateSubtotal(row.quantity, service.unitPrice, row.discountPercent),
            }
          : row
      );
      setServiceRows(updatedRows);
    }
  };

  const handleQuantityChange = (key: string, quantity: number) => {
    const updatedRows = serviceRows.map((row) =>
      row.key === key
        ? {
            ...row,
            quantity,
            subtotal: calculateSubtotal(quantity, row.unitPrice, row.discountPercent),
          }
        : row
    );
    setServiceRows(updatedRows);
  };

  const handleDiscountChange = (key: string, discountPercent: number) => {
    const nextDiscountPercent = getDiscountPercent(discountPercent);
    const updatedRows = serviceRows.map((row) =>
      row.key === key
        ? {
            ...row,
            discountPercent: nextDiscountPercent,
            subtotal: calculateSubtotal(row.quantity, row.unitPrice, nextDiscountPercent),
          }
        : row
    );

    setServiceRows(updatedRows);
  };

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
    }
  };

  const totals = useMemo(() => {
    const grossServicesTotal = serviceRows.reduce(
      (sum, row) => sum + calculateGrossAmount(row.quantity, row.unitPrice),
      0
    );
    const servicesTotal = serviceRows.reduce((sum, row) => sum + row.subtotal, 0);
    const discountTotal = grossServicesTotal - servicesTotal;
    const grandTotal = servicesTotal + existingDebt;
    const remainingDebt = grandTotal - amountPaid;

    return {
      grossServicesTotal,
      discountTotal,
      servicesTotal,
      existingDebt,
      grandTotal,
      amountPaid,
      remainingDebt,
    };
  }, [serviceRows, existingDebt, amountPaid]);

  const handleSaveInvoice = async (status: Invoice['status']) => {
    if (submittingInvoice) {
      return;
    }

    try {
      setSubmittingInvoice(true);
      await form.validateFields();

      if (!selectedPatient) {
        message.error('Vui lòng chọn bệnh nhân!');
        return;
      }

      const validServices = serviceRows.filter((row) => row.serviceId !== '');
      if (validServices.length === 0) {
        message.error('Vui lòng chọn ít nhất một dịch vụ!');
        return;
      }

      const payload = {
        patientId: selectedPatient.id,
        date: editingInvoice ? editingInvoice.date : dayjs().format('YYYY-MM-DD'),
        services: validServices.map((item) => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
        })),
        doctorNotes,
        existingDebt,
        amountPaid,
        status,
      };

      if (editingInvoice) {
        await api.updateInvoice(editingInvoice.id, payload);
        message.success('Đã cập nhật hóa đơn thành công!');
      } else {
        await api.createInvoice(payload);
        message.success('Đã tạo hóa đơn mới thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      await loadData();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const serviceColumns = [
    {
      title: 'Tên Dịch Vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: '28%',
      render: (_: any, record: ServiceRow) =>
        isViewMode ? (
          <Text>{record.serviceName}</Text>
        ) : (
          <Select
            style={{ width: '100%' }}
            placeholder="Chọn dịch vụ"
            value={record.serviceId || undefined}
            onChange={(value) => handleServiceChange(record.key, value)}
            showSearch
            optionFilterProp="children"
            options={serviceCatalog.map((service) => ({
              label: service.name,
              value: service.id,
            }))}
          />
        ),
    },
    {
      title: 'Số Lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '12%',
      render: (_: any, record: ServiceRow) =>
        isViewMode ? (
          <Text>{record.quantity}</Text>
        ) : (
          <InputNumber
            min={1}
            max={100}
            value={record.quantity}
            onChange={(value) => handleQuantityChange(record.key, value || 1)}
            style={{ width: '100%' }}
          />
        ),
    },
    {
      title: 'Đơn Giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: '18%',
      render: (price: number) => (
        <Text className="text-blue-600">{formatVND(price)}</Text>
      ),
    },
    {
      title: 'Giảm Giá',
      dataIndex: 'discountPercent',
      key: 'discountPercent',
      width: '15%',
      render: (discountPercent: number, record: ServiceRow) =>
        isViewMode ? (
          <Text>{getDiscountPercent(discountPercent)}%</Text>
        ) : (
          <Select
            style={{ width: '100%' }}
            value={record.discountPercent}
            onChange={(value) => handleDiscountChange(record.key, value)}
            options={DISCOUNT_PERCENTAGES.map((value) => ({
              label: `${value}%`,
              value,
            }))}
          />
        ),
    },
    {
      title: 'Thành Tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: '17%',
      render: (_: number, record: ServiceRow) => (
        <div className="flex flex-col">
          <Text strong className="text-green-600">
            {formatVND(record.subtotal)}
          </Text>
          {record.discountPercent > 0 && (
            <Text type="secondary" className="text-xs">
              Gốc: {formatVND(calculateGrossAmount(record.quantity, record.unitPrice))}
            </Text>
          )}
        </div>
      ),
    },
    ...(isViewMode
      ? []
      : [
          {
            title: '',
            key: 'action',
            width: '10%',
            render: (_: any, record: ServiceRow) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRow(record.key)}
                disabled={serviceRows.length === 1}
              />
            ),
          },
        ]),
  ];

  const invoiceColumns = [
    {
      title: 'Số HĐ',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Bệnh Nhân',
      key: 'patient',
      width: 200,
      render: (_: any, record: Invoice) => (
        <div>
          <Text strong className="block">{record.patient.name}</Text>
          <Text type="secondary" className="text-sm">
            {record.patient.phone}
          </Text>
        </div>
      ),
    },
    {
      title: 'Tổng Tiền',
      key: 'total',
      width: 150,
      render: (_: any, record: Invoice) => {
        const total = calculateServicesTotal(record.services) + record.existingDebt;
        return <Text className="text-blue-600">{formatVND(total)}</Text>;
      },
    },
    {
      title: 'Đã Thanh Toán',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      width: 150,
      render: (amount: number) => (
        <Text className="text-green-600">{formatVND(amount)}</Text>
      ),
    },
    {
      title: 'Còn Lại',
      key: 'remaining',
      width: 150,
      render: (_: any, record: Invoice) => {
        const total = calculateServicesTotal(record.services) + record.existingDebt;
        const remaining = total - record.amountPaid;
        return (
          <Text strong className={remaining > 0 ? 'text-red-600' : 'text-gray-500'}>
            {formatVND(remaining)}
          </Text>
        );
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (status: Invoice['status']) => getStatusTag(status),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 180,
      align: 'center' as const,
      render: (_: any, record: Invoice) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record)}
            size="small"
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditInvoice(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa hóa đơn này?"
            onConfirm={() => handleDeleteInvoice(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Title level={2}>Quản Lý Điều Trị & Hóa Đơn</Title>
            <Text type="secondary">
              Tạo và quản lý phiếu điều trị, hóa đơn thanh toán cho bệnh nhân
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleNewInvoice}
          >
            Tạo Hóa Đơn Mới
          </Button>
        </div>

        <Card className="shadow-sm">
          {invoices.length === 0 ? (
            <Empty
              description="Chưa có hóa đơn nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleNewInvoice}>
                Tạo Hóa Đơn Đầu Tiên
              </Button>
            </Empty>
          ) : (
            <Table
              loading={loading}
              columns={invoiceColumns}
              dataSource={invoices}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} hóa đơn`,
              }}
              scroll={{ x: 1200 }}
              bordered
            />
          )}
        </Card>

        <Modal
          title={
            <Space>
              {isViewMode ? (
                <EyeOutlined className="text-blue-600" />
              ) : editingInvoice ? (
                <EditOutlined className="text-blue-600" />
              ) : (
                <PlusOutlined className="text-blue-600" />
              )}
              <span>
                {isViewMode
                  ? 'Xem Chi Tiết Hóa Đơn'
                  : editingInvoice
                  ? 'Sửa Hóa Đơn'
                  : 'Tạo Hóa Đơn Mới'}
              </span>
            </Space>
          }
          open={isModalOpen}
          onCancel={() => {
            if (submittingInvoice) {
              return;
            }
            setIsModalOpen(false);
            form.resetFields();
          }}
          width={1000}
          maskClosable={!submittingInvoice}
          keyboard={!submittingInvoice}
          closable={!submittingInvoice}
          footer={
            isViewMode ? (
              <Space>
                <Button icon={<PrinterOutlined />}>In Hóa Đơn</Button>
                <Button onClick={() => setIsModalOpen(false)}>Đóng</Button>
              </Space>
            ) : (
              <Space>
                <Button onClick={() => setIsModalOpen(false)} disabled={submittingInvoice}>
                  Hủy
                </Button>
                <Button onClick={() => handleSaveInvoice('draft')} loading={submittingInvoice} disabled={submittingInvoice}>
                  Lưu Nháp
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => handleSaveInvoice('completed')}
                  loading={submittingInvoice}
                  disabled={submittingInvoice}
                >
                  Lưu & Hoàn Thành
                </Button>
              </Space>
            )
          }
          destroyOnClose
        >
          <Form form={form} layout="vertical">
            <Card className="mb-4" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="patientId"
                    label="Chọn Bệnh Nhân"
                    rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân' }]}
                  >
                    <Select
                      placeholder="Chọn bệnh nhân"
                      size="large"
                      onChange={handlePatientChange}
                      disabled={isViewMode}
                      loading={loadingPatients}
                      showSearch
                      optionFilterProp="children"
                      options={patients.map((patient) => ({
                        label: `${patient.name} - ${patient.phone}`,
                        value: patient.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
                {selectedPatient && (
                  <Col span={12}>
                    <div className="bg-blue-50 p-3 rounded mt-7">
                      <Text strong className="block">{selectedPatient.name}</Text>
                      <Text type="secondary">{selectedPatient.phone}</Text>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>

            <Card className="mb-4" size="small">
              <div className="flex justify-between items-center mb-3">
                <Text strong className="text-base">
                  Dịch Vụ Điều Trị
                </Text>
                {!isViewMode && (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddRow}
                    size="small"
                  >
                    Thêm Dịch Vụ
                  </Button>
                )}
              </div>

              <Table
                columns={serviceColumns}
                dataSource={serviceRows}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 900 }}
                footer={() => (
                  <div className="text-right space-y-1">
                    <div>
                      <Text>
                        Tổng giảm giá:{' '}
                        <span className="text-red-600">{formatVND(totals.discountTotal)}</span>
                      </Text>
                    </div>
                    <div>
                      <Text strong>
                        Tổng tiền dịch vụ:{' '}
                        <span className="text-blue-600 text-base">
                          {formatVND(totals.servicesTotal)}
                        </span>
                      </Text>
                    </div>
                  </div>
                )}
              />
            </Card>

            <Row gutter={16} className="mb-4">
              <Col xs={24} md={12}>
                <Card title="Ghi Chú Bác Sĩ" size="small">
                  <TextArea
                    rows={6}
                    placeholder="Nhập ghi chú về tình trạng răng miệng, kế hoạch điều trị..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    showCount
                    maxLength={500}
                    disabled={isViewMode}
                  />
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="Tổng Kết Tài Chính" size="small">
                  <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                    <div className="flex justify-between items-center">
                      <Text>Tạm tính:</Text>
                      <Text>{formatVND(totals.grossServicesTotal)}</Text>
                    </div>

                    <div className="flex justify-between items-center">
                      <Text>Giảm giá dịch vụ:</Text>
                      <Text strong className="text-red-600">
                        -{formatVND(totals.discountTotal)}
                      </Text>
                    </div>

                    <div className="flex justify-between items-center">
                      <Text>Tổng tiền dịch vụ:</Text>
                      <Text strong className="text-blue-600">
                        {formatVND(totals.servicesTotal)}
                      </Text>
                    </div>

                    <div className="flex justify-between items-center">
                      <Text>Công nợ cũ:</Text>
                      {isViewMode ? (
                        <Text strong className="text-orange-600">
                          {formatVND(existingDebt)}
                        </Text>
                      ) : (
                        <Form.Item name="existingDebt" className="!mb-0">
                          <InputNumber
                            min={0}
                            value={existingDebt}
                            onChange={(value) => setExistingDebt(value || 0)}
                            style={{ width: 180 }}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) => value!.replace(/,/g, '')}
                            addonAfter="VND"
                          />
                        </Form.Item>
                      )}
                    </div>

                    <Divider className="my-2" />

                    <div className="flex justify-between items-center">
                      <Text strong className="text-base">
                        Tổng cộng:
                      </Text>
                      <Text strong className="text-purple-600 text-lg">
                        {formatVND(totals.grandTotal)}
                      </Text>
                    </div>

                    <div className="flex justify-between items-center">
                      <Text>Số tiền thanh toán:</Text>
                      {isViewMode ? (
                        <Text strong className="text-green-600">
                          {formatVND(amountPaid)}
                        </Text>
                      ) : (
                        <Form.Item name="amountPaid" className="!mb-0">
                          <InputNumber
                            min={0}
                            max={totals.grandTotal}
                            value={amountPaid}
                            onChange={(value) => setAmountPaid(value || 0)}
                            style={{ width: 180 }}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) => value!.replace(/,/g, '')}
                            addonAfter="VND"
                          />
                        </Form.Item>
                      )}
                    </div>

                    <Divider className="my-2" />

                    <div className="flex justify-between items-center bg-red-50 px-3 py-2 rounded">
                      <Text strong>Còn lại:</Text>
                      <Text
                        strong
                        className={
                          totals.remainingDebt > 0 ? 'text-red-600 text-lg' : 'text-gray-500'
                        }
                      >
                        {formatVND(totals.remainingDebt)}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
