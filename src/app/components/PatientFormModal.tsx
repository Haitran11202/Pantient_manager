import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Row, Col } from 'antd';

const { TextArea } = Input;

export interface PatientFormData {
  id?: string;
  fullName: string;
  phoneNumber: string;
  birthYear?: number;
  address?: string;
  medicalHistory?: string;
}

interface PatientFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (values: PatientFormData) => void;
  initialValues?: PatientFormData;
  title?: string;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  open,
  onCancel,
  onSave,
  initialValues,
  title = 'Thêm Bệnh Nhân',
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Lưu"
      cancelText="Hủy"
      width={700}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        name="patientForm"
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fullName"
              label="Họ và Tên"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên' },
                { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
              ]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phoneNumber"
              label="Số Điện Thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="birthYear"
              label="Năm Sinh"
              rules={[
                {
                  type: 'number',
                  min: 1900,
                  max: new Date().getFullYear(),
                  message: `Năm sinh phải từ 1900 đến ${new Date().getFullYear()}`,
                },
              ]}
            >
              <InputNumber
                placeholder="Nhập năm sinh"
                style={{ width: '100%' }}
                controls={false}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="address" label="Địa Chỉ">
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="medicalHistory" label="Tiền Sử Bệnh">
          <TextArea
            placeholder="Nhập tiền sử bệnh, dị ứng, thuốc đang dùng, v.v."
            rows={4}
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
