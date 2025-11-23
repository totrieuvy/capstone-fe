import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Tag,
  Popconfirm,
  Spin,
  message,
  Space,
  Tooltip,
  Divider,
  Typography, // Thêm Typography và Card cho giao diện giá
  Card,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { FiEdit, FiTrash2 } from "react-icons/fi"; // Thêm import icon mới
import type { TableColumnsType } from "antd";
import api from "../../../../config/axios"; // Import axios instance
import { toast } from "react-toastify";
import { getFormattedPrice } from "../../../../utils/formatPrice";
import "./ManageComboGrooming.scss";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";

interface ApiResponse {
  code: number;
  message: string;
}

// --- Interfaces ---
interface Service {
  id: string;
  serviceName: string;
  isActive: boolean;
}

// Interface for detailed Service response
interface ServiceDetailResponse {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  prices: {
    priceId: string;
    speciesId: string;
    speciesName: string;
    price: number;
  }[];
  displayPrice?: string;
}

interface Species {
  id: string;
  speciesName: string;
}

// Simplified interface for the list response
interface ComboListItem {
  id: string;
  comboName: string;
  description: string;
  serviceCount: number;
  isActive: boolean;
}

// Detailed Combo interface (used for editing/creating and potentially detail view)
interface ComboDetail {
  id: string;
  comboName: string;
  description: string;
  isActive: boolean;
  services: {
    id: string;
    serviceType: string;
    serviceName: string;
    description: string;
  }[];
  prices: {
    speciesId: string;
    speciesName: string;
    price: number; // Base price
    priceAfter: number; // Discounted price
  }[];
}

interface ComboFormValues {
  id?: string;
  comboName: string;
  description: string;
  serviceIds: string[];
  prices: {
    speciesId: string;
    priceAfter: number;
  }[];
  // Add isActive if you want to control it in the form
  isActive?: boolean;
}

const { Search } = Input;
const { Text, Title } = Typography; // Khai báo Typography

function ManageComboGrooming() {
  const [combos, setCombos] = useState<ComboListItem[]>([]); // Use simplified interface for list
  const [filteredCombos, setFilteredCombos] = useState<ComboListItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [, setEditingRecord] = useState<ComboDetail | null>(null); // Use Detail interface for editing
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm<ComboFormValues>();

  // --- API Calls ---

  const fetchSpecies = useCallback(async (): Promise<Species[]> => {
    try {
      const response = await api.get<{ code: number; data: Species[] }>("/api/species");
      if (response.data.code === 200) {
        setSpecies(response.data.data);
        return response.data.data;
      } else {
        toast.error("Lấy danh sách loài thất bại!");
        return [];
      }
    } catch (error) {
      toast.error("Lấy danh sách loài thất bại! " + (error as Error).message);
      return [];
    }
  }, []);

  const fetchServices = useCallback(async (): Promise<Service[]> => {
    try {
      const response = await api.get<{ code: number; data: Service[] }>("/api/services/type/GROOMING");
      if (response.data.code === 200) {
        const activeServices = response.data.data.filter((s: Service) => s.isActive);
        setServices(activeServices);
        return activeServices;
      } else {
        toast.error("Lấy danh sách dịch vụ grooming thất bại!");
        return [];
      }
    } catch (error) {
      toast.error("Lấy danh sách dịch vụ grooming thất bại! " + (error as Error).message);
      return [];
    }
  }, []);

  // Fetch Combo List (using simplified interface)
  const fetchCombos = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Use the endpoint that returns the simplified list
      const response = await api.get<{ code: number; data: ComboListItem[] }>("/api/combo");
      if (response.data.code === 200) {
        setCombos(response.data.data);
        setFilteredCombos(response.data.data); // Initialize filter
      }
    } catch (error) {
      console.error("Fetch combos error:", error);
      toast.error("Lấy danh sách combo thất bại! " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Combo Detail (for editing)
  const fetchComboDetailForEdit = async (comboId: string): Promise<ComboDetail | null> => {
    setSubmitLoading(true); // Reuse submit loading indicator
    try {
      const response = await api.get<{ code: number; data: ComboDetail }>(`/api/combo/${comboId}`);
      if (response.data.code === 200) {
        return response.data.data;
      } else {
        message.error(`Không thể tải chi tiết combo ID: ${comboId}`);
        return null;
      }
    } catch (error) {
      message.error(`Lỗi khi tải chi tiết combo ID: ${comboId}`);
      console.error("Fetch combo detail error:", error);
      return null;
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    document.title = "Quản lí Combo Grooming";
    const loadData = async () => {
      await fetchSpecies();
      await fetchServices();
      await fetchCombos(); // Fetch the list
    };
    loadData();
  }, [fetchCombos, fetchServices, fetchSpecies]);

  // --- Search Effect ---
  useEffect(() => {
    const handleSearch = () => {
      const lowerSearchText = searchText.toLowerCase();
      // Search only on fields available in ComboListItem
      const filtered = combos.filter(
        (item) =>
          item.comboName.toLowerCase().includes(lowerSearchText) ||
          item.description.toLowerCase().includes(lowerSearchText)
      );
      setFilteredCombos(filtered);
    };
    handleSearch();
  }, [searchText, combos]);

  // --- Modal & Form Actions ---
  const handleOpenAdd = (): void => {
    setIsUpdate(false);
    setEditingRecord(null);
    form.resetFields();

    // Tạo giá trị prices mặc định cho TẤT CẢ loài
    const defaultPrices = species.map((spec) => ({
      speciesId: spec.id,
      priceAfter: 0, // Giá mặc định 0 VND
    }));

    form.setFieldsValue({
      prices: defaultPrices, // Thay bằng giá trị cho tất cả các loài
      isActive: true, // Default to active for new combos
    });
    setIsModalVisible(true);
  };

  // Modified to fetch details before opening edit modal
  const handleOpenEdit = async (record: ComboListItem): Promise<void> => {
    const detailedData = await fetchComboDetailForEdit(record.id);
    if (detailedData) {
      setIsUpdate(true);
      setEditingRecord(detailedData); // Store detailed data

      // Khởi tạo form prices dựa trên species list, mapping giá đã có
      const existingPricesMap = new Map(detailedData.prices.map((p) => [p.speciesId, p.priceAfter]));
      const formPrices = species.map((spec) => ({
        speciesId: spec.id,
        // Lấy giá đã có, nếu chưa có thì mặc định là 0
        priceAfter: existingPricesMap.get(spec.id) ?? 0,
      }));

      form.setFieldsValue({
        id: detailedData.id,
        comboName: detailedData.comboName,
        description: detailedData.description,
        serviceIds: detailedData.services.map((s) => s.id), // Extract service IDs
        prices: formPrices, // Sử dụng danh sách giá cho TẤT CẢ loài
        isActive: detailedData.isActive,
      });
      setIsModalVisible(true);
    }
  };

  const handleCancel = (): void => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
  };

  const handleSubmit = async (values: ComboFormValues): Promise<void> => {
    // Basic validation remains the same
    if (!values.prices || values.prices.length === 0) {
      message.error("Vui lòng nhập giá sau giảm cho tất cả các loài.");
      return;
    }
    if (!values.serviceIds || values.serviceIds.length === 0) {
      message.error("Vui lòng chọn ít nhất một dịch vụ cho combo.");
      return;
    }

    setSubmitLoading(true);
    try {
      // Step 1: Fetch service details (remains the same)
      const serviceDetailPromises = values.serviceIds.map((serviceId) =>
        api.get<{ code: number; data: ServiceDetailResponse }>(`/api/services/${serviceId}`)
      );
      const serviceDetailResponses = await Promise.all(serviceDetailPromises);
      const fetchedServiceDetails: ServiceDetailResponse[] = [];
      for (const response of serviceDetailResponses) {
        if (response.data.code === 200 && response.data.data) {
          fetchedServiceDetails.push(response.data.data);
        } else {
          throw new Error(`Không thể lấy chi tiết dịch vụ (ID: ${response.config.url?.split("/").pop()}).`);
        }
      }

      // Step 2: Calculate base prices and validate
      const pricesToSubmit = values.prices.filter((p) => p.priceAfter !== undefined && p.priceAfter !== null);

      const calculatedPricesPromises = pricesToSubmit.map(async (priceEntry) => {
        const currentSpeciesId = priceEntry.speciesId;
        let calculatedBasePrice = 0;
        fetchedServiceDetails.forEach((serviceDetail) => {
          const servicePriceForSpecies = serviceDetail.prices.find((p) => p.speciesId === currentSpeciesId);
          if (servicePriceForSpecies) {
            calculatedBasePrice += servicePriceForSpecies.price;
          } else {
            const speciesName = species.find((s) => s.id === currentSpeciesId)?.speciesName || currentSpeciesId;
            throw new Error(`Dịch vụ "${serviceDetail.serviceName}" không có giá cho loài "${speciesName}".`);
          }
        });
        if (priceEntry.priceAfter > calculatedBasePrice) {
          const speciesName = species.find((s) => s.id === currentSpeciesId)?.speciesName || currentSpeciesId;
          throw new Error(
            `Giá sau giảm (${getFormattedPrice(
              priceEntry.priceAfter
            )}) của loài "${speciesName}" không thể lớn hơn tổng giá gốc (${getFormattedPrice(calculatedBasePrice)}).`
          );
        }
        return {
          speciesId: currentSpeciesId,
          price: calculatedBasePrice,
          priceAfter: priceEntry.priceAfter,
        };
      });
      const finalCalculatedPrices = await Promise.all(calculatedPricesPromises);

      // Step 3: Construct payload (add isActive)
      const payload = {
        comboName: values.comboName,
        description: values.description,
        serviceIds: values.serviceIds,
        prices: finalCalculatedPrices,
        isActive: values.isActive === undefined ? true : values.isActive, // Add isActive, default true
      };

      // Step 4: Send API request (remains the same)
      let response;
      if (isUpdate && values.id) {
        response = await api.put(`/api/combo/${values.id}`, payload);
      } else {
        response = await api.post("/api/combo", payload);
      }

      // Check response (remains the same)
      if (response.data.code === 200 || response.status === 200 || response.status === 201) {
        toast.success(isUpdate ? "Cập nhật combo thành công!" : "Thêm combo thành công!");
        fetchCombos(); // Refresh list uses the simplified list now
        handleCancel();
      } else {
        throw new Error(response.data.message || "Phản hồi API không thành công");
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ApiResponse>;

      const errorMsg = err.message || err.response?.data?.message || "Thao tác thất bại!";
      console.error("Submit combo error:", err);
      message.error(`${errorMsg}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`/api/combo/${id}`);
      if (response.status === 200 || response.data?.code === 200) {
        toast.success("Xóa combo thành công!");
        fetchCombos(); // Refresh list
      } else {
        throw new Error(response.data?.message || "Xóa thất bại");
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ApiResponse>;
      const errorMsg = err.response?.data?.message || err.message || "Xóa thất bại!";
      toast.error(`Xóa thất bại: ${errorMsg}`);
    }
  };

  // --- Table Columns ---
  const columns: TableColumnsType<ComboListItem> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      ellipsis: true,
      render: (id: string) => (
        <Link
          to={`/ADMIN/quan-li-dich-vu-grooming/grooming-combo/${id}`}
          style={{ color: "#1890ff", fontWeight: "500" }}
        >
          {id}
        </Link>
      ),
    },
    {
      title: "Tên Combo",
      dataIndex: "comboName",
      key: "comboName",
      sorter: (a, b) => a.comboName.localeCompare(b.comboName),
      width: 250,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 350,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Số dịch vụ",
      dataIndex: "serviceCount",
      key: "serviceCount",
      width: 120,
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      align: "center",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          {/* Nút Sửa (dùng FiEdit) */}
          <Button
            type="primary"
            icon={<FiEdit />}
            onClick={() => handleOpenEdit(record)}
            size="small"
            style={{ display: "flex", alignItems: "center" }}
          />
          <Popconfirm
            title="Xóa combo?"
            description="Bạn có chắc muốn xóa combo này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            {/* Nút Xóa (dùng FiTrash2) */}
            <Button
              type="primary"
              danger
              icon={<FiTrash2 />}
              size="small"
              style={{ display: "flex", alignItems: "center" }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="ManageComboGrooming">
      <h1>Quản lí Combo Grooming</h1>

      <div className="toolbar">
        <Search
          placeholder="Tìm theo tên, mô tả..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
          Thêm Combo
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          dataSource={filteredCombos}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      </Spin>

      {/* --- Modal --- */}
      <Modal
        open={isModalVisible}
        title={isUpdate ? "Cập nhật Combo" : "Thêm Combo Mới"}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Spin spinning={submitLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            // Khởi tạo giá trị ban đầu cho prices
            initialValues={{ prices: species.map((spec) => ({ speciesId: spec.id, priceAfter: 0 })), isActive: true }}
          >
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              label="Tên Combo"
              name="comboName"
              rules={[{ required: true, message: "Vui lòng nhập tên combo!" }]}
            >
              <Input placeholder="Nhập tên combo" />
            </Form.Item>
            <Form.Item label="Mô tả" name="description" rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}>
              <Input.TextArea rows={3} placeholder="Mô tả chi tiết về combo" />
            </Form.Item>
            <Form.Item
              label="Dịch vụ bao gồm"
              name="serviceIds"
              rules={[{ required: true, message: "Vui lòng chọn ít nhất một dịch vụ!" }]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="Chọn các dịch vụ grooming đang hoạt động"
                optionFilterProp="label"
                options={services.map((service) => ({
                  value: service.id,
                  label: service.serviceName,
                }))}
              />
            </Form.Item>

            <Divider />
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ color: "#ff6f61" }}>
                Giá Combo Theo Loài (Sau Giảm Giá)
              </Title>
              <Spin spinning={loading}>
                <Card size="small" style={{ background: "#f9f9f9" }}>
                  {/* Lặp qua danh sách species cố định */}
                  {species.map((spec, index) => (
                    <div
                      key={spec.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom: index < species.length - 1 ? "1px solid #e0e0e0" : "none",
                      }}
                    >
                      {/* Form.Item ẩn để lưu speciesId */}
                      <Form.Item name={["prices", index, "speciesId"]} hidden initialValue={spec.id}>
                        <Input />
                      </Form.Item>

                      <Text strong style={{ minWidth: "120px" }}>
                        {spec.speciesName}
                      </Text>

                      {/* Form.Item nhập giá sau giảm */}
                      <Form.Item
                        name={["prices", index, "priceAfter"]}
                        label="Giá sau giảm (VND)" // Thêm label để hiện dấu *
                        rules={[
                          { required: true, message: `Vui lòng nhập giá sau giảm cho ${spec.speciesName}!` },
                          { type: "number", min: 0, message: "Giá không thể âm!" },
                        ]}
                        // Custom style để ẩn label hiển thị và dùng style cũ cho input
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0}
                          step={1000}
                          style={{ width: "200px" }}
                          placeholder="Nhập giá"
                          addonAfter="VND"
                          formatter={(value: string | number | undefined) => {
                            const v = value?.toString() || "";
                            return v.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                          }}
                          parser={(value: string | undefined) => {
                            return value ? value.replace(/,/g, "") : "";
                          }}
                        />
                      </Form.Item>
                    </div>
                  ))}
                </Card>
              </Spin>
            </div>
            <Divider />

            {/* Add IsActive Toggle/Switch if needed */}
            {/* <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                 <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
             </Form.Item> */}

            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Space>
                <Button onClick={handleCancel}> Hủy </Button>
                <Button type="primary" htmlType="submit" loading={submitLoading}>
                  {isUpdate ? "Cập nhật Combo" : "Thêm Combo"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default ManageComboGrooming;
