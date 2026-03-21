import { useEffect, useState } from 'react';
import { ConfigProvider, Button, Card, Space, Typography, Tabs, Flex, App as AntApp, message, Popconfirm } from 'antd';
import { DashboardOutlined, UserAddOutlined, EditOutlined, FileTextOutlined, CalendarOutlined, DollarOutlined, CreditCardOutlined, DeleteOutlined } from '@ant-design/icons';
import { PatientFormModal, PatientFormData } from './components/PatientFormModal';
import { TreatmentInvoice } from './components/TreatmentInvoice';
import { DailyAppointments } from './components/DailyAppointments';
import { ServicesPricing } from './components/ServicesPricing';
import { DebtPaymentManagement } from './components/DebtPaymentManagement';
import { DashboardOverview } from './components/DashboardOverview';
import { api } from './api/client';

const { Title, Text } = Typography;

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<PatientFormData[]>([]);
  const [editingPatient, setEditingPatient] = useState<PatientFormData | undefined>();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingPatients, setLoadingPatients] = useState(false);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      message.error('Không tải được danh sách bệnh nhân');
      console.error(error);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleOpenModal = () => {
    setEditingPatient(undefined);
    setIsModalOpen(true);
  };

  const handleEditPatient = (patient: PatientFormData) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleSave = async (values: PatientFormData) => {
    try {
      const payload = {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        birthYear: values.birthYear,
        address: values.address,
        medicalHistory: values.medicalHistory,
      };

      if (editingPatient?.id) {
        await api.updatePatient(editingPatient.id, payload);
        message.success('Đã cập nhật bệnh nhân');
      } else {
        await api.createPatient(payload);
        message.success('Đã thêm bệnh nhân mới');
      }

      setIsModalOpen(false);
      setEditingPatient(undefined);
      await loadPatients();
    } catch (error) {
      message.error('Không lưu được bệnh nhân');
      console.error(error);
    }
  };

  const handleDeletePatient = async (id?: string) => {
    if (!id) {
      return;
    }

    try {
      await api.deletePatient(id);
      message.success('Đã xóa bệnh nhân');
      await loadPatients();
    } catch (error) {
      message.error('Không xóa được bệnh nhân');
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingPatient(undefined);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <div className="min-h-screen bg-gray-50 pr-4 pl-4">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            className="px-8 pt-6"
            items={[
              {
                key: 'dashboard',
                label: (
                  <span>
                    <DashboardOutlined className="mr-2" />
                    Dashboard
                  </span>
                ),
                children: <DashboardOverview />,
              },
              {
                key: 'appointments',
                label: (
                  <span>
                    <CalendarOutlined className="mr-2" />
                    Lịch Hẹn Hàng Ngày
                  </span>
                ),
                children: <DailyAppointments />,
              },
              {
                key: 'patients',
                label: (
                  <span>
                    <UserAddOutlined className="mr-2" />
                    Quản Lý Bệnh Nhân
                  </span>
                ),
                children: (
                  <div className="max-w-5xl mx-auto pb-8">
                    <Card loading={loadingPatients}>
                      <div className="flex justify-between items-center mb-6">
                        <Title level={2} className="!mb-0">
                          Phòng Khám Nha Khoa - Quản Lý Bệnh Nhân
                        </Title>
                        <Button
                          type="primary"
                          icon={<UserAddOutlined />}
                          size="large"
                          onClick={handleOpenModal}
                        >
                          Thêm Bệnh Nhân
                        </Button>
                      </div>

                      {patients.length === 0 ? (
                        <div className="text-center py-12">
                          <Text type="secondary">
                            Chưa có bệnh nhân nào. Nhấn "Thêm Bệnh Nhân" để bắt đầu.
                          </Text>
                        </div>
                      ) : (
                        <Flex vertical gap="middle">
                          {patients.map((patient) => (
                            <Card key={patient.id} variant="outlined">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Title level={4} className="!mb-2">
                                    {patient.fullName}
                                  </Title>
                                  <Space orientation="vertical" size={2}>
                                    <Text>Điện thoại: {patient.phoneNumber}</Text>
                                    {patient.birthYear && <Text>Năm sinh: {patient.birthYear}</Text>}
                                    {patient.address && <Text>Địa chỉ: {patient.address}</Text>}
                                    {patient.medicalHistory && (
                                      <Text type="secondary" className="text-sm">
                                        Tiền sử bệnh: {patient.medicalHistory}
                                      </Text>
                                    )}
                                  </Space>
                                </div>
                                <Space>
                                  <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditPatient(patient)}
                                  >
                                    Sửa
                                  </Button>
                                  <Popconfirm
                                    title="Xác nhận xóa"
                                    description="Bạn có chắc muốn xóa bệnh nhân này?"
                                    onConfirm={() => handleDeletePatient(patient.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                  >
                                    <Button type="link" danger icon={<DeleteOutlined />}>
                                      Xóa
                                    </Button>
                                  </Popconfirm>
                                </Space>
                              </div>
                            </Card>
                          ))}
                        </Flex>
                      )}
                    </Card>
                  </div>
                ),
              },
              {
                key: 'treatment',
                label: (
                  <span>
                    <FileTextOutlined className="mr-2" />
                    Điều Trị & Hóa Đơn
                  </span>
                ),
                children: <TreatmentInvoice />,
              },
              {
                key: 'pricing',
                label: (
                  <span>
                    <DollarOutlined className="mr-2" />
                    Quản Lý Dịch Vụ & Giá
                  </span>
                ),
                children: <ServicesPricing />,
              },
              {
                key: 'debt',
                label: (
                  <span>
                    <CreditCardOutlined className="mr-2" />
                    Quản Lý Công Nợ
                  </span>
                ),
                children: <DebtPaymentManagement />,
              },
            ]}
          />

          <PatientFormModal
            open={isModalOpen}
            onCancel={handleCancel}
            onSave={handleSave}
            initialValues={editingPatient}
            title={editingPatient ? 'Sửa Bệnh Nhân' : 'Thêm Bệnh Nhân'}
          />
        </div>
      </AntApp>
    </ConfigProvider>
  );
}
