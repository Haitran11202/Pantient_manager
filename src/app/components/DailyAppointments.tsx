import React, { useState, useMemo, useEffect } from 'react';
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
  Dropdown,
  Spin,
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
import { api, AppointmentDto } from '../api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

type AppointmentStatus = 'waiting' | 'completed' | 'cancelled';
type Appointment = AppointmentDto;

export const DailyAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (error) {
      message.error('Không tải được lịch hẹn');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

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

  const filteredByDate = useMemo(() => {
    return appointments.filter(
      (appointment) => appointment.date === selectedDate.format('YYYY-MM-DD')
    );
  }, [appointments, selectedDate]);

  const filteredAppointments = useMemo(() => {
    let filtered = filteredByDate;

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(search) ||
          apt.phone.includes(search) ||
          apt.reason.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    return filtered.sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredByDate, searchText, statusFilter]);

  const statistics = useMemo(() => {
    return {
      total: filteredByDate.length,
      waiting: filteredByDate.filter((a) => a.status === 'waiting').length,
      completed: filteredByDate.filter((a) => a.status === 'completed').length,
      cancelled: filteredByDate.filter((a) => a.status === 'cancelled').length,
    };
  }, [filteredByDate]);

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

  const handleDeleteAppointment = async (id: string) => {
    try {
      await api.deleteAppointment(id);
      message.success('Đã xóa lịch hẹn thành công!');
      await loadAppointments();
    } catch (error) {
      message.error('Xóa lịch hẹn thất bại');
      console.error(error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const apt = appointments.find((item) => item.id === id);
      if (!apt) {
        return;
      }

      await api.updateAppointment(id, {
        patientName: apt.patientName,
        phone: apt.phone,
        date: apt.date,
        time: apt.time,
        reason: apt.reason,
        status: newStatus,
        notes: apt.notes,
      });

      message.success(`Đã cập nhật trạng thái thành "${getStatusLabel(newStatus)}"`);
      await loadAppointments();
    } catch (error) {
      message.error('Không cập nhật được trạng thái');
      console.error(error);
    }
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

  const handleSaveAppointment = async () => {
    try {
      const values = await form.validateFields();

      const appointmentData = {
        patientName: values.patientName,
        phone: values.phone,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        reason: values.reason,
        status: values.status,
        notes: values.notes,
      };

      if (editingAppointment) {
        await api.updateAppointment(editingAppointment.id, appointmentData);
        message.success('Đã cập nhật lịch hẹn thành công!');
      } else {
        await api.createAppointment(appointmentData);
        message.success('Đã tạo lịch hẹn mới thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      await loadAppointments();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

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

          <Card>
            <div className="flex flex-col gap-4">
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

        <Spin spinning={loading}>
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

                      <div className="bg-blue-50 p-3 rounded">
                        <Text type="secondary" className="text-xs block mb-1">
                          Lý do khám:
                        </Text>
                        <Text className="text-sm">{appointment.reason}</Text>
                      </div>

                      {appointment.notes && (
                        <div className="bg-yellow-50 p-2 rounded">
                          <Text type="secondary" className="text-xs">
                            Ghi chú: {appointment.notes}
                          </Text>
                        </div>
                      )}

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
        </Spin>

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
