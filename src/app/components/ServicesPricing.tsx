import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Switch,
  Space,
  Card,
  Typography,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { api, ServiceDto } from '../api/client';

const { Title, Text } = Typography;

type Service = ServiceDto;

export const ServicesPricing: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await api.getServices();
      setServices(data);
    } catch (error) {
      message.error('Không tải được danh sách dịch vụ');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const filteredServices = useMemo(() => {
    return services.filter(
      (service) =>
        service.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        service.serviceId.toLowerCase().includes(searchText.toLowerCase()) ||
        service.description.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [services, searchText]);

  const handleStatusToggle = async (service: Service, checked: boolean) => {
    try {
      await api.updateService(service.id, {
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        unitPrice: service.unitPrice,
        description: service.description,
        status: checked,
      });
      await loadServices();
    } catch (error) {
      message.error('Không cập nhật được trạng thái dịch vụ');
      console.error(error);
    }
  };

  const handleEdit = (record: Service) => {
    setEditingService(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleAddService = () => {
    setEditingService(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteService(id);
      message.success('Đã xóa dịch vụ');
      await loadServices();
    } catch (error) {
      message.error('Không xóa được dịch vụ');
      console.error(error);
    }
  };

  const handleSaveService = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        serviceId: values.serviceId,
        serviceName: values.serviceName,
        unitPrice: values.unitPrice,
        description: values.description,
        status: values.status,
      };

      if (editingService) {
        await api.updateService(editingService.id, payload);
        message.success('Đã cập nhật dịch vụ');
      } else {
        await api.createService(payload);
        message.success('Đã thêm dịch vụ mới');
      }

      setIsModalOpen(false);
      form.resetFields();
      await loadServices();
    } catch (error) {
      console.error(error);
    }
  };

  const columns: TableColumnsType<Service> = [
    {
      title: 'Mã Dịch Vụ',
      dataIndex: 'serviceId',
      key: 'serviceId',
      width: 120,
      sorter: (a, b) => a.serviceId.localeCompare(b.serviceId),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Tên Dịch Vụ',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 250,
      sorter: (a, b) => a.serviceName.localeCompare(b.serviceName),
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: 'Đơn Giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 180,
      sorter: (a, b) => a.unitPrice - b.unitPrice,
      render: (price: number) => (
        <Text strong className="text-blue-600">
          {formatVND(price)}
        </Text>
      ),
    },
    {
      title: 'Mô Tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: { showTitle: false },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <Text type="secondary">{description}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Tạm ngưng', value: false },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: boolean, record: Service) => (
        <Space size="small">
          <Switch
            checked={status}
            onChange={(checked) => handleStatusToggle(record, checked)}
            checkedChildren="Hoạt động"
            unCheckedChildren="Tạm ngưng"
          />
        </Space>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, record: Service) => (
        <Space>
          <Tooltip title="Chỉnh sửa dịch vụ">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="text-blue-600"
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc muốn xóa dịch vụ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <Title level={2}>Quản Lý Dịch Vụ & Giá</Title>
          <Text type="secondary">
            Quản lý dịch vụ nha khoa, giá cả và tình trạng hoạt động
          </Text>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <Input
              placeholder="Tìm kiếm theo tên, mã dịch vụ hoặc mô tả..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%', maxWidth: 400 }}
              size="large"
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleAddService}
            >
              Thêm Dịch Vụ Mới
            </Button>
          </div>

          <div className="flex gap-6 mb-6">
            <div className="bg-blue-50 px-4 py-3 rounded-lg">
              <Text type="secondary" className="text-sm block">
                Tổng Dịch Vụ
              </Text>
              <Text strong className="text-2xl text-blue-600">
                {services.length}
              </Text>
            </div>
            <div className="bg-green-50 px-4 py-3 rounded-lg">
              <Text type="secondary" className="text-sm block">
                Đang Hoạt Động
              </Text>
              <Text strong className="text-2xl text-green-600">
                {services.filter((s) => s.status).length}
              </Text>
            </div>
            <div className="bg-orange-50 px-4 py-3 rounded-lg">
              <Text type="secondary" className="text-sm block">
                Tạm Ngưng
              </Text>
              <Text strong className="text-2xl text-orange-600">
                {services.filter((s) => !s.status).length}
              </Text>
            </div>
          </div>

          <Table
            loading={loading}
            columns={columns}
            dataSource={filteredServices}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} dịch vụ`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1000 }}
            bordered
            size="middle"
          />
        </Card>

        <Modal
          title={editingService ? 'Sửa Dịch Vụ' : 'Thêm Dịch Vụ'}
          open={isModalOpen}
          onOk={handleSaveService}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
          }}
          okText="Lưu"
          cancelText="Hủy"
        >
          <Form form={form} layout="vertical">
            <Form.Item name="serviceId" label="Mã Dịch Vụ" rules={[{ required: true, message: 'Vui lòng nhập mã dịch vụ' }]}>
              <Input placeholder="VD: DV009" />
            </Form.Item>
            <Form.Item name="serviceName" label="Tên Dịch Vụ" rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="unitPrice" label="Đơn Giá" rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}>
              <InputNumber style={{ width: '100%' }} min={0} addonAfter="VND" />
            </Form.Item>
            <Form.Item name="description" label="Mô Tả" rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="status" label="Trạng Thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm ngưng" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
