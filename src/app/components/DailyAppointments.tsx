import React, { useState, useMemo } from 'react';
import {
  Card,
  Empty,
  Button,
  Space,
  Typography,
  Tag,
  Statistic,
  Row,
  Col,
  DatePicker,
  Modal,
  Form,
  Input,
  TimePicker,
  Select,
  message,
  Popconfirm,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Appointment status type
type AppointmentStatus = 'waiting' | 'completed' | 'cancelled';

// Appointment interface
interface Appointment {
  id: string;
  time: string;
  patientName: string;
  phone: string;
  reason: string;
  status: AppointmentStatus;
  date: string; // YYYY-MM-DD format
  notes?: string;
}

// Mock appointment data
const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'A001',
    time: '08:00',
    patientName: 'Nguyễn Thị Hoa',
    phone: '+84 901 234 567',
    reason: 'Khám tổng quát & Làm sạch răng',
    status: 'completed',
    date: '2026-03-17',
    notes: 'Bệnh nhân đã hoàn thành khám.',
  },
  {
    id: 'A002',
    time: '09:00',
    patientName: 'Trần Văn Minh',
    phone: '+84 902 345 678',
    reason: 'Đau răng - Răng hàm trên bên phải',
    status: 'completed',
    date: '2026-03-17',
  },
  {
    id: 'A003',
    time: '09:30',
    patientName: 'Lê Thị Mai',
    phone: '+84 903 456 789',
    reason: 'Lắp răng sứ',
    status: 'waiting',
    date: '2026-03-17',
  },
  {
    id: 'A004',
    time: '10:30',
    patientName: 'Phạm Quốc Tuấn',
    phone: '+84 904 567 890',
    reason: 'Điều trị tủy răng - Buổi 2',
    status: 'waiting',
    date: '2026-03-17',
  },
  {
    id: 'A005',
    time: '11:00',
    patientName: 'Võ Thị Lan',
    phone: '+84 905 678 901',
    reason: 'Tư vấn tẩy trắng răng',
    status: 'cancelled',
    date: '2026-03-17',
    notes: 'Bệnh nhân hủy do bận việc đột xuất.',
  },
  {
    id: 'A006',
    time: '14:00',
    patientName: 'Đỗ Văn Hùng',
    phone: '+84 906 789 012',
    reason: 'Tái khám cấy ghép Implant',
    status: 'waiting',
    date: '2026-03-17',
  },
  {
    id: 'A007',
    time: '14:30',
    patientName: 'Hoàng Thị Thu',
    phone: '+84 907 890 123',
    reason: 'Trám răng sâu - Răng hàm dưới trái',
    status: 'waiting',
    date: '2026-03-17',
  },
  {
    id: 'A008',
    time: '15:30',
    patientName: 'Bùi Văn Nam',
    phone: '+84 908 901 234',
    reason: 'Cấp cứu - Răng bị gãy',
    status: 'waiting',
    date: '2026-03-17',
  },
  {
    id: 'A009',
    time: '16:00',
    patientName: 'Ngô Thị Hằng',
    phone: '+84 909 012 345',
    reason: 'Điều chỉnh niềng răng',
    status: 'waiting',
    date: '2026-03-17',
  },
  {
    id: 'A010',
    time: '16:30',
    patientName: 'Dương Văn Sơn',
    phone: '+84 910 123 456',
    reason: 'Chụp X-quang và tư vấn',
    status: 'waiting',
    date: '2026-03-17',
  },
  // Tomorrow's appointments
  {
    id: 'A011',
    time: '09:00',
    patientName: 'Trịnh Thị Bích',
    phone: '+84 911 234 567',
    reason: 'Nhổ răng khôn',
    status: 'waiting',
    date: '2026-03-18',
  },
  {
    id: 'A012',
    time: '10:00',
    patientName: 'Lý Văn Đạt',
    phone: '+84 912 345 678',
    reason: 'Cạo vôi răng định kỳ',
    status: 'waiting',
    date: '2026-03-18',
  },
  // Yesterday's appointments
  {
    id: 'A013',
    time: '15:00',
    patientName: 'Mai Thị Lan',
    phone: '+84 913 456 789',
    reason: 'Lắp mão răng sứ',
    status: 'completed',
    date: '2026-03-16',
  },
  {
    id: 'A014',
    time: '16:00',
    patientName: 'Vũ Văn Hải',
    phone: '+84 914 567 890',
    reason: 'Khám răng định kỳ',
    status: 'completed',
    date: '2026-03-16',
  },
];

export const DailyAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [form] = Form.useForm();

  // Get status tag configuration
  const getStatusTag = (status: AppointmentStatus) => {
    switch (status) {
      case 'waiting':
        return <Tag color="warning">Đang chờ</Tag>;
      case 'completed':
        return <Tag color="success">Hoàn thành</Tag>;
      case 'cancelled':
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
    }
  };

  // Filter appointments by selected date
  const filteredByDate = useMemo(() => {
    return appointments.filter(
      (appointment) => appointment.date === selectedDate.format('YYYY-MM-DD')
    );
  }, [appointments, selectedDate]);

  // Filter by search text and status
  const filteredAppointments = useMemo(() => {
    let filtered = filteredByDate;

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(search) ||
          apt.phone.includes(search) ||
          apt.reason.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Sort by time
    return filtered.sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredByDate, searchText, statusFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    return {
      total: filteredByDate.length,
      waiting: filteredByDate.filter((a) => a.status === 'waiting').length,
      completed: filteredByDate.filter((a) => a.status === 'completed').length,
      cancelled: filteredByDate.filter((a) => a.status === 'cancelled').length,
    };
  }, [filteredByDate]);

  // Handle new appointment
  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setIsViewMode(false);
    form.resetFields();
    form.setFieldsValue({
      date: selectedDate,
      status: 'waiting',
    });
    setIsModalOpen(true);
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsViewMode(false);
    form.setFieldsValue({
      patientName: appointment.patientName,
      phone: appointment.phone,
      date: dayjs(appointment.date),
      time: dayjs(appointment.time, 'HH:mm'),
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes,
    });
    setIsModalOpen(true);
  };

  // Handle view appointment
  const handleViewAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsViewMode(true);
    form.setFieldsValue({
      patientName: appointment.patientName,
      phone: appointment.phone,
      date: dayjs(appointment.date),
      time: dayjs(appointment.time, 'HH:mm'),
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes,
    });
    setIsModalOpen(true);
  };

  // Handle delete appointment
  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== id));
    message.success('Đã xóa lịch hẹn thành công!');
  };

  // Handle status change
  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    setAppointments(
      appointments.map((apt) =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      )
    );
    message.success(`Đã cập nhật trạng thái thành "${getStatusLabel(newStatus)}"`);
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'waiting':
        return 'Đang chờ';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
    }
  };

  // Handle save appointment
  const handleSaveAppointment = async () => {
    try {
      const values = await form.validateFields();
      
      const appointmentData: Appointment = {
        id: editingAppointment ? editingAppointment.id : `A${Date.now()}`,
        patientName: values.patientName,
        phone: values.phone,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        reason: values.reason,
        status: values.status,
        notes: values.notes,
      };

      if (editingAppointment) {
        setAppointments(
          appointments.map((apt) =>
            apt.id === editingAppointment.id ? appointmentData : apt
          )
        );
        message.success('Đã cập nhật lịch hẹn thành công!');
      } else {
        setAppointments([...appointments, appointmentData]);
        message.success('Đã tạo lịch hẹn mới thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Get action menu items for each appointment
  const getActionMenu = (appointment: Appointment): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Xem chi tiết',
      onClick: () => handleViewAppointment(appointment),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa',
      onClick: () => handleEditAppointment(appointment),
    },
    {
      type: 'divider',
    },
    {
      key: 'status',
      label: 'Thay đổi trạng thái',
      children: [
        {
          key: 'waiting',
          label: 'Đang chờ',
          icon: <ClockCircleOutlined />,
          disabled: appointment.status === 'waiting',
          onClick: () => handleStatusChange(appointment.id, 'waiting'),
        },
        {
          key: 'completed',
          label: 'Hoàn thành',
          icon: <CheckCircleOutlined />,
          disabled: appointment.status === 'completed',
          onClick: () => handleStatusChange(appointment.id, 'completed'),
        },
        {
          key: 'cancelled',
          label: 'Đã hủy',
          icon: <CloseCircleOutlined />,
          disabled: appointment.status === 'cancelled',
          onClick: () => handleStatusChange(appointment.id, 'cancelled'),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa lịch hẹn',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Xác nhận xóa',
          content: 'Bạn có chắc muốn xóa lịch hẹn này?',
          okText: 'Xóa',
          cancelText: 'Hủy',
          okButtonProps: { danger: true },
          onOk: () => handleDeleteAppointment(appointment.id),
        });
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Title level={2} className="!mb-2">
                Lịch Hẹn Hàng Ngày
              </Title>
              <Text type="secondary">
                Quản lý và theo dõi lịch hẹn bệnh nhân trong ngày
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleNewAppointment}
            >
              Thêm Lịch Hẹn
            </Button>
          </div>

          {/* Date Picker and Statistics */}
          <Card>
            <div className="flex flex-col gap-4">
              {/* Date Picker and Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <Space>
                  <Text strong>
                    <CalendarOutlined className="mr-2" />
                    Chọn ngày:
                  </Text>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                    size="large"
                    format="DD/MM/YYYY"
                    allowClear={false}
                    placeholder="Chọn ngày"
                  />
                </Space>

                <Input
                  placeholder="Tìm kiếm theo tên, SĐT, lý do khám..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                  size="large"
                  allowClear
                />

                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  size="large"
                  style={{ width: 160 }}
                  options={[
                    { label: 'Tất cả trạng thái', value: 'all' },
                    { label: 'Đang chờ', value: 'waiting' },
                    { label: 'Hoàn thành', value: 'completed' },
                    { label: 'Đã hủy', value: 'cancelled' },
                  ]}
                  suffixIcon={<FilterOutlined />}
                />
              </div>

              {/* Statistics */}
              <Row gutter={16}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Tổng số"
                    value={statistics.total}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Đang chờ"
                    value={statistics.waiting}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Hoàn thành"
                    value={statistics.completed}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Đã hủy"
                    value={statistics.cancelled}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <Card>
            <Empty
              description={
                <span>
                  {searchText || statusFilter !== 'all' ? (
                    'Không tìm thấy lịch hẹn phù hợp'
                  ) : (
                    <>
                      Không có lịch hẹn cho ngày{' '}
                      <strong>{selectedDate.format('DD/MM/YYYY')}</strong>
                    </>
                  )}
                </span>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleNewAppointment}>
                Đặt Lịch Hẹn
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredAppointments.map((appointment) => (
              <Col xs={24} sm={24} md={12} lg={8} xl={6} key={appointment.id}>
                <Card
                  hoverable
                  className="h-full"
                  styles={{ body: { padding: '20px' } }}
                  variant="outlined"
                >
                  <Space orientation="vertical" size="middle" className="w-full">
                    {/* Time and Status */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <ClockCircleOutlined className="text-blue-500 text-lg mr-2" />
                        <Text strong className="text-lg">
                          {appointment.time}
                        </Text>
                      </div>
                      <div className="flex gap-2 items-center">
                        {getStatusTag(appointment.status)}
                        <Dropdown
                          menu={{ items: getActionMenu(appointment) }}
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                    </div>

                    {/* Patient Name */}
                    <div className="flex items-start">
                      <UserOutlined className="text-gray-500 mt-1 mr-2" />
                      <div className="flex-1">
                        <Text strong className="block">
                          {appointment.patientName}
                        </Text>
                        <div className="flex items-center mt-1">
                          <PhoneOutlined className="text-gray-400 text-xs mr-1" />
                          <Text type="secondary" className="text-sm">
                            {appointment.phone}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-blue-50 p-3 rounded">
                      <Text type="secondary" className="text-xs block mb-1">
                        Lý do khám:
                      </Text>
                      <Text className="text-sm">{appointment.reason}</Text>
                    </div>

                    {/* Notes if available */}
                    {appointment.notes && (
                      <div className="bg-yellow-50 p-2 rounded">
                        <Text type="secondary" className="text-xs">
                          Ghi chú: {appointment.notes}
                        </Text>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewAppointment(appointment)}
                        block
                      >
                        Xem
                      </Button>
                      {appointment.status === 'waiting' && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                          block
                        >
                          Hoàn thành
                        </Button>
                      )}
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Appointment Modal */}
        <Modal
          title={
            <Space>
              {isViewMode ? (
                <EyeOutlined className="text-blue-600" />
              ) : editingAppointment ? (
                <EditOutlined className="text-blue-600" />
              ) : (
                <PlusOutlined className="text-blue-600" />
              )}
              <span>
                {isViewMode
                  ? 'Chi Tiết Lịch Hẹn'
                  : editingAppointment
                  ? 'Sửa Lịch Hẹn'
                  : 'Thêm Lịch Hẹn Mới'}
              </span>
            </Space>
          }
          open={isModalOpen}
          onOk={handleSaveAppointment}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
          }}
          okText={isViewMode ? undefined : editingAppointment ? 'Cập nhật' : 'Tạo lịch hẹn'}
          cancelText={isViewMode ? 'Đóng' : 'Hủy'}
          width={700}
          footer={
            isViewMode
              ? [
                  <Button key="close" onClick={() => setIsModalOpen(false)}>
                    Đóng
                  </Button>,
                  <Button
                    key="edit"
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setIsViewMode(false)}
                  >
                    Chỉnh sửa
                  </Button>,
                ]
              : undefined
          }
          destroyOnClose
        >
          <Form form={form} layout="vertical" disabled={isViewMode}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="patientName"
                  label="Tên Bệnh Nhân"
                  rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân' }]}
                >
                  <Input placeholder="Nhập tên bệnh nhân" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Số Điện Thoại"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    {
                      pattern: /^[+\d\s()-]+$/,
                      message: 'Số điện thoại không hợp lệ',
                    },
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label="Ngày Hẹn"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày hẹn' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày hẹn"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="time"
                  label="Giờ Hẹn"
                  rules={[{ required: true, message: 'Vui lòng chọn giờ hẹn' }]}
                >
                  <TimePicker
                    style={{ width: '100%' }}
                    format="HH:mm"
                    placeholder="Chọn giờ hẹn"
                    size="large"
                    minuteStep={15}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="reason"
              label="Lý Do Khám"
              rules={[{ required: true, message: 'Vui lòng nhập lý do khám' }]}
            >
              <TextArea
                rows={3}
                placeholder="Nhập lý do khám bệnh..."
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Form.Item name="status" label="Trạng Thái">
              <Select
                size="large"
                options={[
                  { label: 'Đang chờ', value: 'waiting' },
                  { label: 'Hoàn thành', value: 'completed' },
                  { label: 'Đã hủy', value: 'cancelled' },
                ]}
              />
            </Form.Item>

            <Form.Item name="notes" label="Ghi Chú">
              <TextArea
                rows={3}
                placeholder="Nhập ghi chú bổ sung (tùy chọn)..."
                showCount
                maxLength={300}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
