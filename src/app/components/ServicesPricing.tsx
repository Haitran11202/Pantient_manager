import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Switch,
  Space,
  Card,
  Typography,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';

const { Title, Text } = Typography;

// Service interface
interface Service {
  id: string;
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  description: string;
  status: boolean;
}

// Mock data - Vietnamese dental services
const INITIAL_SERVICES: Service[] = [
  {
    id: '1',
    serviceId: 'DV001',
    serviceName: 'Nhổ răng khôn',
    unitPrice: 1500000,
    description: 'Nhổ răng khôn mọc lệch, mọc ngầm hoặc gây đau',
    status: true,
  },
  {
    id: '2',
    serviceId: 'DV002',
    serviceName: 'Cạo vôi răng',
    unitPrice: 200000,
    description: 'Làm sạch cao răng và mảng bám trên bề mặt răng',
    status: true,
  },
  {
    id: '3',
    serviceId: 'DV003',
    serviceName: 'Trám răng Composite',
    unitPrice: 350000,
    description: 'Trám răng bằng vật liệu composite thẩm mỹ cao',
    status: true,
  },
  {
    id: '4',
    serviceId: 'DV004',
    serviceName: 'Điều trị tủy răng',
    unitPrice: 800000,
    description: 'Điều trị tủy răng bị viêm nhiễm hoặc chết tủy',
    status: true,
  },
  {
    id: '5',
    serviceId: 'DV005',
    serviceName: 'Bọc răng sứ',
    unitPrice: 2500000,
    description: 'Bọc răng sứ cao cấp, thẩm mỹ tự nhiên',
    status: true,
  },
  {
    id: '6',
    serviceId: 'DV006',
    serviceName: 'Niềng răng mắc cài kim loại',
    unitPrice: 25000000,
    description: 'Niềng răng chỉnh nha bằng mắc cài kim loại truyền thống',
    status: true,
  },
  {
    id: '7',
    serviceId: 'DV007',
    serviceName: 'Tẩy trắng răng',
    unitPrice: 3000000,
    description: 'Tẩy trắng răng công nghệ Laser Whitening',
    status: true,
  },
  {
    id: '8',
    serviceId: 'DV008',
    serviceName: 'Cấy ghép Implant',
    unitPrice: 20000000,
    description: 'Cấy ghép răng Implant titanium cao cấp',
    status: true,
  },
  {
    id: '9',
    serviceId: 'DV009',
    serviceName: 'Nhổ răng sữa',
    unitPrice: 150000,
    description: 'Nhổ răng sữa cho trẻ em an toàn, không đau',
    status: true,
  },
  {
    id: '10',
    serviceId: 'DV010',
    serviceName: 'Chụp X-quang răng',
    unitPrice: 100000,
    description: 'Chụp phim X-quang toàn cảnh hàm mặt',
    status: true,
  },
  {
    id: '11',
    serviceId: 'DV011',
    serviceName: 'Khám tổng quát răng miệng',
    unitPrice: 100000,
    description: 'Khám và tư vấn tình trạng răng miệng tổng quát',
    status: true,
  },
  {
    id: '12',
    serviceId: 'DV012',
    serviceName: 'Bọc răng sứ Titan',
    unitPrice: 1800000,
    description: 'Bọc răng sứ Titan bền chắc, giá cả phải chăng',
    status: false,
  },
  {
    id: '13',
    serviceId: 'DV013',
    serviceName: 'Phủ Fluoride cho trẻ em',
    unitPrice: 150000,
    description: 'Phủ Fluoride bảo vệ men răng cho trẻ em',
    status: true,
  },
  {
    id: '14',
    serviceId: 'DV014',
    serviceName: 'Hàn trám răng Amalgam',
    unitPrice: 200000,
    description: 'Hàn trám răng bằng hỗn hống Amalgam',
    status: false,
  },
  {
    id: '15',
    serviceId: 'DV015',
    serviceName: 'Làm cầu răng sứ',
    unitPrice: 4500000,
    description: 'Làm cầu răng sứ 3 răng, phục hồi răng mất',
    status: true,
  },
];

export const ServicesPricing: React.FC = () => {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [searchText, setSearchText] = useState<string>('');
  const [filteredServices, setFilteredServices] = useState<Service[]>(INITIAL_SERVICES);

  // Format VND currency
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = services.filter(
      (service) =>
        service.serviceName.toLowerCase().includes(value.toLowerCase()) ||
        service.serviceId.toLowerCase().includes(value.toLowerCase()) ||
        service.description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredServices(filtered);
  };

  // Handle status toggle
  const handleStatusToggle = (id: string, checked: boolean) => {
    const updatedServices = services.map((service) =>
      service.id === id ? { ...service, status: checked } : service
    );
    setServices(updatedServices);
    setFilteredServices(
      updatedServices.filter(
        (service) =>
          service.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
          service.serviceId.toLowerCase().includes(searchText.toLowerCase()) ||
          service.description.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  // Handle edit
  const handleEdit = (record: Service) => {
    console.log('Edit service:', record);
    // This would open an edit modal in a real application
  };

  // Handle add new service
  const handleAddService = () => {
    console.log('Add new service');
    // This would open an add modal in a real application
  };

  // Table columns
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
      ellipsis: {
        showTitle: false,
      },
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
            onChange={(checked) => handleStatusToggle(record.id, checked)}
            checkedChildren="Hoạt động"
            unCheckedChildren="Tạm ngưng"
          />
        </Space>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record: Service) => (
        <Tooltip title="Chỉnh sửa dịch vụ">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-600"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Title level={2}>Quản Lý Dịch Vụ & Giá</Title>
          <Text type="secondary">
            Quản lý dịch vụ nha khoa, giá cả và tình trạng hoạt động
          </Text>
        </div>

        {/* Main Card */}
        <Card>
          {/* Search and Add Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <Input
              placeholder="Tìm kiếm theo tên, mã dịch vụ hoặc mô tả..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
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

          {/* Statistics */}
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

          {/* Table */}
          <Table
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
      </div>
    </div>
  );
};