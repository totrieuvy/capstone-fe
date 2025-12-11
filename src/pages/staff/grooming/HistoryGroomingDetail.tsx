import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  message,
  Spin,
  Button,
  Tag,
  Upload,
  Card,
  Descriptions,
  Image,
  Typography,
  Row,
  Col,
  Divider,
  Select,
  Popconfirm,
  Modal,
  Radio,
} from "antd";
import {
  PlusOutlined,
  RetweetOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ScissorOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import api from "../../../config/axios";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../config/firebase";
import "./HistoryGroomingDetail.scss";
import dayjs from "dayjs";
import { getFormattedPrice } from "../../../utils/formatPrice";
import { toast } from "react-toastify";
import type { UploadFile } from "antd/es/upload/interface";

const { Title, Text } = Typography;
const { Option } = Select;

interface Staff {
  id: string;
  fullName?: string;
}

interface ServiceItem {
  id: string;
  serviceId?: string;
  serviceName?: string;
  serviceComboName?: string;
  price: number;
  comboServices?: string[];
  serviceComboId?: string; // 👈 Thêm dòng này
}

interface GroomingDetail {
  customerId: string;
  hamsterId?: string;
  id: string;
  customerName: string;
  hamsterName: string;
  appointmentTime: string;
  status: string;
  totalAmount: number;
  totalAmountAfter: number;
  additionalAmount?: number;
  notes?: string;
  checkInImage?: string;
  checkoutImage?: string;
  slotStart?: string;
  slotEnd?: string;
  createdAt: string;
  staff?: Staff;
  speciesId?: string;
  items: ServiceItem[];
  discountPercent: number;
}

interface Service {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  durationMinutes: number;
  displayPrice: string;
  isActive: boolean;
}

interface Species {
  id: string;
  speciesName: string;
}

interface ComboService {
  id: string;
  comboName: string;
  description: string;
  serviceCount: number;
  displayPrice: string;
  isActive: boolean;
}

interface SlotStaff {
  id: string;
  name: string;
  isBooked: boolean;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  maxSlots: number;
  availableSlot: number;
  staffs: SlotStaff[];
}

interface SlotDay {
  slotDate: string;
  slots: TimeSlot[];
}

interface MyUploadFile extends UploadFile {
  thumbUrl?: string;
}

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const HistoryGroomingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<GroomingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [checkoutUploading, setCheckoutUploading] = useState(false);
  const [groomingServices, setGroomingServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [, setCheckOutImageUrl] = useState<string | null>(null);
  const [comboServices, setComboServices] = useState<ComboService[]>([]);

  const [assignLoading, setAssignLoading] = useState(false);
  // const [, setAssignStaffList] = useState<Staff[]>([]);
  // const [selectedAssignStaff, setSelectedAssignStaff] = useState<string | null>(null);
  // const [, setShowAssignDropdown] = useState(false);

  // Check-in modal states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInFile, setCheckInFile] = useState<File | null>(null);
  const [selectedStaffForCheckIn, setSelectedStaffForCheckIn] = useState<string | null>(null);
  const [staffListForCheckIn, setStaffListForCheckIn] = useState<Staff[]>([]);

  const [fileList, setFileList] = useState<MyUploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState("");

  const fetchSpecies = async () => {
    try {
      const res = await api.get("/api/species");
      if (res.data.code === 200) {
        setSpeciesList(res.data.data);
      }
    } catch {
      message.error("Không thể tải danh sách loài!");
    }
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj as File);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf("/") + 1));
  };

  // const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
  //   setFileList(newFileList);
  // };

  const fetchComboBySpecies = useCallback(async (speciesId: string) => {
    try {
      const res = await api.get(`/api/combo/species/${speciesId}`);
      if (res.data.code === 200) {
        setComboServices(res.data.data);
      }
    } catch {
      message.error("Không thể tải combo!");
    }
  }, []);

  // ======================= FETCH =======================
  const fetchServicesBySpecies = useCallback(async (speciesId: string) => {
    try {
      const res = await api.get(`/api/services/species/${speciesId}`);
      if (res.data.code === 200) {
        const filtered = res.data.data.filter((s: Service) => s.serviceType === "GROOMING");
        setGroomingServices(filtered);
      }
    } catch {
      message.error("Không thể tải danh sách dịch vụ theo loài!");
    }
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/appointment/${id}`);
      if (res.data.code === 200) {
        const data: GroomingDetail = res.data.data;
        setDetail(data);
        if (data.speciesId) {
          fetchServicesBySpecies(data.speciesId);
          fetchComboBySpecies(data.speciesId); // 👈 thêm dòng này
        }
      } else message.error(res.data.message);
    } catch {
      message.error("Lỗi khi tải chi tiết grooming!");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchServicesBySpecies]);

  // ======================= ĐỔI LOÀI =======================
  const handleChangeSpecies = async () => {
    if (!detail || !selectedSpecies) return;
    try {
      await api.patch(`/api/appointment/${detail.id}`, { status: "CANCELLED" });
      await api.put(`/api/hamster/change-species`, {
        hamsterId: detail.hamsterId,
        speciesId: selectedSpecies,
      });
      toast.success("Đã đổi loài và hủy lịch hiện tại!");
      fetchDetail();
    } catch {
      toast.error("Không thể đổi loài!");
    }
  };

  const parseVND = (v: string | number | null | undefined): number => {
    if (v == null) return 0;
    if (typeof v === "number") return v;

    // Bỏ hết ký tự không phải số (bao gồm dấu phẩy, chấm)
    const onlyDigits = v.replace(/[^\d]/g, "");

    return Number(onlyDigits || 0);
  };

  // luôn gửi HH:mm
  const toHHmm = (t?: string | null) => {
    if (!t) return undefined;
    const m = t.match(/^(\d{2}:\d{2})/);
    return m ? m[1] : t;
  };

  // ======================= TẠO LỊCH MỚI =======================
  const handleCreateAppointment = async () => {
    if (!detail) return;
    try {
      // map serviceId -> giá (đã bỏ dấu phẩy)
      const speciesPriceMap = new Map(groomingServices.map((s) => [s.id, parseVND(s.displayPrice)]));
      const comboPriceMap = new Map(comboServices.map((c) => [c.id, parseVND(c.displayPrice)]));

      // áp giá theo speciesId hiện tại cho từng item
      const items = (detail.items || []).map((i) => {
        let price = 0;

        if (i.serviceId) {
          price = speciesPriceMap.get(i.serviceId) ?? parseVND(i.price);
        } else if (i.serviceComboId) {
          price = comboPriceMap.get(i.serviceComboId) ?? parseVND(i.price);
        }

        return {
          serviceId: i.serviceId ?? null,
          serviceComboId: i.serviceComboId ?? null,
          price,
        };
      });

      // tính tổng (VND)
      const totalAmount = items.reduce((sum, it) => sum + parseVND(it.price), 0);
      const discountPercent = Number(detail.discountPercent || 0);
      const totalAmountAfter = Math.round((totalAmount * (100 - discountPercent)) / 100);

      await api.post(`/api/appointment`, {
        customerId: detail.customerId,
        hamsterId: detail.hamsterId,
        staffId: detail.staff?.id,
        appointmentDate: dayjs(detail.appointmentTime, "DD-MM-YYYY").format("DD-MM-YYYY"),
        slotStart: toHHmm(detail.slotStart),
        slotEnd: toHHmm(detail.slotEnd),
        notes: detail.notes,
        serviceType: "GROOMING",
        discountPercent, // giữ nguyên %
        totalAmount, // vd: 155000
        totalAmountAfter, // vd: 139500 nếu discountPercent=10
        items, // mỗi item.price là số VND (không có dấu phẩy)
        isConfirmed: true,
      });

      toast.success("Tạo lịch mới thành công!");
      fetchDetail?.();
    } catch {
      toast.error("Không thể tạo lịch mới!");
    }
  };

  useEffect(() => {
    document.title = "Chi tiết Grooming";
    fetchSpecies();
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    document.title = "Chi tiết Grooming";
    fetchDetail();
  }, [fetchDetail]);

  // ======================= STATUS =======================
  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      BOOKED: "gold",
      CHECKED_IN: "processing",
      IN_PROGRESS: "cyan",
      CHECKOUT: "success",
      CANCELLED: "red",
      CHECK_OUT: "green",
      FAILED: "purple",
    };
    const textMap: Record<string, string> = {
      BOOKED: "Đã đặt",
      CHECKED_IN: "Đã check-in",
      IN_PROGRESS: "Đang thực hiện",
      CHECKOUT: "Hoàn tất",
      CANCELLED: "Đã hủy",
      CHECK_OUT: "Hoàn tất",
      FAILED: "Thanh toán thất bại",
    };
    return (
      <Tag color={colorMap[status] || "default"} style={{ fontWeight: 600, fontSize: "14px" }}>
        {textMap[status] || status}
      </Tag>
    );
  };

  // ======================= CHECK-IN =======================
  const openCheckInModal = async () => {
    if (!detail) return;

    setShowCheckInModal(true);
    setAssignLoading(true);

    try {
      const startDate = dayjs(detail.appointmentTime, "DD-MM-YYYY").format("DD-MM-YYYY");

      const res = await api.get("/api/slot", {
        params: {
          from: startDate,
          to: startDate,
          serviceType: "GROOMING",
        },
      });

      if (res.data.code !== 200) {
        toast.error("Không thể tải danh sách nhân viên!");
        setAssignLoading(false);
        return;
      }

      const slotsData: SlotDay[] = res.data.data;

      const matchDay = slotsData.find((d) => d.slotDate === detail.appointmentTime);

      if (!matchDay) {
        toast.warning("Không có slot phù hợp!");
        setAssignLoading(false);
        return;
      }

      const matchSlot = matchDay.slots.find(
        (s) => s.startTime === detail.slotStart?.slice(0, 5) && s.endTime === detail.slotEnd?.slice(0, 5)
      );

      if (!matchSlot) {
        toast.warning("Không có nhân viên rảnh!");
        setStaffListForCheckIn([]);
        setAssignLoading(false);
        return;
      }

      const available: Staff[] = (matchSlot.staffs ?? [])
        .filter((st: SlotStaff) => st.isBooked === false)
        .map((st: SlotStaff) => ({
          id: st.id,
          fullName: st.name,
        }));

      setStaffListForCheckIn(available);
    } catch {
      toast.error("Lỗi khi tải nhân viên!");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCloseCheckInModal = () => {
    // revoke object URLs nếu có (chỉ những thumbUrl do chúng ta tạo)
    fileList.forEach((f) => {
      const thumb = f.thumbUrl;
      if (thumb && thumb.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(thumb);
        } catch {
          // ignore
        }
      }
    });

    setShowCheckInModal(false);
    setCheckInFile(null);
    setFileList([]);
    setSelectedStaffForCheckIn(null);
    setPreviewImage("");
    setPreviewOpen(false);
  };

  const handleCheckInConfirm = async () => {
    if (!id || !detail) {
      toast.error("Thiếu thông tin lịch!");
      return;
    }

    // staff có thể là detail.staff.id (nếu đã assign) hoặc selectedStaffForCheckIn (radio)
    const staffId = detail.staff?.id ?? selectedStaffForCheckIn;
    if (!staffId) {
      toast.error("Vui lòng chọn nhân viên!");
      return;
    }

    // lấy file: ưu tiên fileList[0].originFileObj nếu có, fallback checkInFile
    const fileObj = (fileList[0]?.originFileObj as File) || checkInFile;
    if (!fileObj) {
      toast.error("Vui lòng chọn ảnh check-in!");
      return;
    }

    setUploading(true);

    try {
      const fileRef = ref(storage, `checkin/${id}-${Date.now()}-${fileObj.name}`);
      await uploadBytes(fileRef, fileObj);
      const url = await getDownloadURL(fileRef);

      await api.post(`/api/appointment/check-in`, {
        appointmentId: id,
        checkInImage: url,
        staffId,
      });

      toast.success("Check-in thành công!");
      handleCloseCheckInModal();
      fetchDetail();
    } catch {
      toast.error("Lỗi khi check-in!");
    } finally {
      setUploading(false);
    }
  };

  const handleSetInProgress = async () => {
    if (!id) return;
    try {
      await api.patch(`/api/appointment/${id}`, { status: "IN_PROGRESS" });
      toast.success("Cập nhật trạng thái: Đang thực hiện!");
      fetchDetail();
    } catch {
      toast.error("Không thể cập nhật trạng thái!");
    }
  };

  //cancel
  const handleCancelAppointment = async () => {
    if (!id) return;
    try {
      await api.patch(`/api/appointment/${id}`, { status: "CANCELLED" });
      toast.success("Đã hủy lịch Grooming thành công!");
      fetchDetail();
    } catch {
      toast.error("Không thể hủy lịch Grooming!");
    }
  };

  // ======================= ADD SERVICE =======================
  const handleAddServices = async () => {
    if (!id || selectedServices.length === 0 || !detail) return;

    // Lấy danh sách dịch vụ mới
    const selectedItems = groomingServices
      .filter((s) => selectedServices.includes(s.id))
      .map((s) => ({
        serviceId: s.id,
        price: parseInt(s.displayPrice.replace(/[^\d]/g, ""), 10),
      }));

    // Tổng giá của dịch vụ mới thêm
    const newAddedTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);

    // Tổng tất cả dịch vụ hiện có
    const totalItemsBefore = (detail.items || []).reduce((sum, item) => sum + Number(item.price || 0), 0);

    // Tổng giá gốc ban đầu (dịch vụ chính, chưa giảm)
    const baseBeforeDiscount = Number(detail.totalAmount || 0);

    // Tính phần dịch vụ bổ sung (trước giảm)
    const previousAddedBeforeDiscount =
      totalItemsBefore > baseBeforeDiscount ? totalItemsBefore - baseBeforeDiscount : 0;

    // Tổng dịch vụ bổ sung (chưa giảm)
    const totalAddedBeforeDiscount = previousAddedBeforeDiscount + newAddedTotal;

    // Áp dụng giảm giá cho phần bổ sung

    // ✅ Gửi tổng dịch vụ bổ sung CHƯA GIẢM lên server
    try {
      await api.post("/api/appointment/add-service", {
        appointmentId: id,
        additionalAmount: totalAddedBeforeDiscount, // gửi tổng CHƯA giảm
        items: selectedItems,
      });
      toast.success("Đã thêm dịch vụ thành công!");
      setSelectedServices([]);
      fetchDetail();
    } catch {
      toast.error("Không thể thêm dịch vụ!");
    }
  };

  // ======================= CHECK-OUT =======================
  const handleUploadCheckOut = async (file: File) => {
    if (!id || !detail) return;
    setCheckoutUploading(true);
    try {
      const fileRef = ref(storage, `checkout/${id}-${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setCheckOutImageUrl(url);

      // Tính additionalAmount (nếu có)
      const additionalAmount = detail.additionalAmount || 0;

      // Gọi API mới /appointment/check-out
      const res = await api.post("/api/appointment/check-out", {
        appointmentId: id,
        checkOutImage: url,
        paymentMethod: "PAYOS",
        additionalAmount,
      });

      if (res.data.code === 200 && res.data.data?.paymentUrl) {
        toast.success("Tạo link thanh toán thành công!");
        window.location.href = res.data.data.paymentUrl;
        fetchDetail();
      } else {
        toast.success("Check-out thành công!");
        fetchDetail();
      }
    } catch {
      toast.error("Không thể thực hiện check-out!");
    } finally {
      setCheckoutUploading(false);
    }
  };

  // ======================= UI =======================
  if (loading)
    return (
      <div className="loading-spinner-container">
        <Spin size="large" tip="Đang tải chi tiết..." />
      </div>
    );

  if (!detail)
    return (
      <div className="history-grooming-detail-page">
        <div className="container error-container">
          <Title level={3} style={{ color: "#ff4d4f" }}>
            Không tìm thấy lịch hẹn
          </Title>
          <Button onClick={() => navigate("/STAFF/lich-dat-grooming")}>Quay lại</Button>
        </div>
      </div>
    );

  // Tính tổng tiền các dịch vụ đã thêm (ngoài combo ban đầu)
  const baseAfterDiscount = Number(detail.totalAmountAfter || 0); // tiền sau giảm
  const baseBeforeDiscount = Number(detail.totalAmount || 0); // tiền gốc chưa giảm

  // Tổng tất cả dịch vụ hiện có (bao gồm cả dịch vụ mới thêm)
  const itemsTotal = (detail.items || []).reduce((sum, it) => sum + Number(it.price || 0), 0);

  // Nếu tổng items lớn hơn tổng ban đầu → đó là phần dịch vụ bổ sung
  const additionalAmount = itemsTotal > baseBeforeDiscount ? itemsTotal - baseBeforeDiscount : 0;

  // Áp dụng giảm giá cho dịch vụ bổ sung (giống discount của đơn)
  const discountPercent = Number(detail.discountPercent || 0);
  const additionalAfterDiscount = Math.round((additionalAmount * (100 - discountPercent)) / 100);

  // Tổng thanh toán thực tế = tiền ban đầu (đã giảm) + phần bổ sung (đã giảm)
  const totalPrice = baseAfterDiscount + additionalAfterDiscount;

  const currentSpecies = speciesList.find((s) => s.id === detail.speciesId)?.speciesName || "Không xác định";

  // ======================= RETURN =======================
  return (
    <div className="history-grooming-detail-page">
      <div className="container">
        <div className="detail-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/STAFF/lich-dat-grooming")}
            className="back-button"
          >
            Quay lại danh sách
          </Button>
          <div className="header-content">
            <Title level={2} className="page-title">
              <ScissorOutlined /> Chi tiết Lịch Grooming
            </Title>
            <Text className="booking-id">ID: {detail.id}</Text>
          </div>
          <div className="header-status">{getStatusTag(detail.status)}</div>
        </div>

        <Row gutter={[24, 24]}>
          {/* ---- Thông tin ---- */}
          <Col xs={24} md={14}>
            <Card bordered={false} className="info-card section-card">
              <Descriptions
                title={
                  <>
                    <IdcardOutlined /> Thông tin Lịch hẹn
                  </>
                }
                bordered
                column={1}
                size="middle"
              >
                <Descriptions.Item label="Khách hàng">{detail.customerName}</Descriptions.Item>
                <Descriptions.Item label="Hamster">
                  {detail.hamsterName}
                  <br />
                  <Text>Loài: {currentSpecies}</Text>
                  {detail.status === "BOOKED" && (
                    <>
                      <Select
                        placeholder="Chọn loài khác"
                        style={{ width: "100%", marginTop: 6 }}
                        onChange={setSelectedSpecies}
                        value={selectedSpecies || undefined}
                      >
                        {speciesList
                          .filter((s) => s.id !== detail.speciesId)
                          .map((s) => (
                            <Option key={s.id} value={s.id}>
                              {s.speciesName}
                            </Option>
                          ))}
                      </Select>
                      {selectedSpecies && (
                        <Popconfirm
                          title="Xác nhận đổi loài?"
                          description={`Đổi từ ${currentSpecies} sang ${
                            speciesList.find((s) => s.id === selectedSpecies)?.speciesName
                          }. Lịch hiện tại sẽ bị hủy!`}
                          okText="Đồng ý"
                          cancelText="Hủy"
                          onConfirm={handleChangeSpecies}
                        >
                          <Button type="link" icon={<RetweetOutlined />} danger>
                            Xác nhận đổi loài
                          </Button>
                        </Popconfirm>
                      )}
                    </>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hẹn">
                  {dayjs(detail.appointmentTime, "DD-MM-YYYY").format("DD/MM/YYYY")}
                </Descriptions.Item>
                {detail.slotStart && (
                  <Descriptions.Item label="Khung giờ">
                    <Tag color="blue">
                      {detail.slotStart} - {detail.slotEnd}
                    </Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Nhân viên">
                  {detail.staff ? detail.staff.fullName : <Tag color="red">Chưa chọn nhân viên</Tag>}
                </Descriptions.Item>
              </Descriptions>

              {detail.status === "CANCELLED" && (
                <Card className="cancel-card section-card" bordered={false}>
                  <Popconfirm
                    title="Tạo lịch Grooming mới?"
                    description="Lịch hiện tại đã bị hủy. Bạn có muốn tạo lại lịch mới không?"
                    onConfirm={handleCreateAppointment}
                    okText="Tạo mới"
                    cancelText="Hủy"
                  >
                    <Button type="primary" icon={<PlusOutlined />} block>
                      Tạo lịch Grooming mới
                    </Button>
                  </Popconfirm>
                </Card>
              )}
            </Card>
            <br />
            {/* ---- Dịch vụ ---- */}
            <Card className="services-card section-card" bordered={false}>
              <Title level={4}>
                <ScissorOutlined /> Dịch vụ đã chọn
              </Title>
              {detail.items.map((item) => (
                <div key={item.id} className="service-item">
                  {item.serviceName ? (
                    // ---- Dịch vụ lẻ ----
                    <>
                      <Text strong>{item.serviceName}</Text>
                      <Text className="service-price">{getFormattedPrice(item.price)}</Text>
                    </>
                  ) : (
                    // ---- Combo ----
                    <>
                      <Text strong>{item.serviceComboName}</Text>
                      <div className="combo-services">
                        {item.comboServices?.map((srv, idx) => (
                          <Text key={idx} type="secondary" style={{ display: "block", marginLeft: 8 }}>
                            • {srv}
                          </Text>
                        ))}
                      </div>
                      <Text className="service-price">{getFormattedPrice(item.price)}</Text>
                    </>
                  )}
                </div>
              ))}

              <Divider />
              <Title level={5}>Chọn thêm dịch vụ Grooming</Title>
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Chọn dịch vụ Grooming"
                value={selectedServices}
                onChange={setSelectedServices}
              >
                {groomingServices
                  .filter((service) => {
                    const usedServiceIds = detail.items.map((item) => item.serviceId);
                    return !usedServiceIds.includes(service.id);
                  })
                  .map((service) => (
                    <Option key={service.id} value={service.id}>
                      {service.serviceName} ({getFormattedPrice(service.displayPrice)})
                    </Option>
                  ))}
              </Select>

              <Button
                type="primary"
                style={{ marginTop: 12 }}
                disabled={selectedServices.length === 0}
                onClick={handleAddServices}
              >
                Thêm dịch vụ đã chọn
              </Button>
            </Card>
          </Col>

          {/* ---- Thanh toán & Hình ảnh ---- */}
          <Col xs={24} md={10}>
            <Card className="payment-card section-card" bordered={false}>
              <Title level={4}>
                <DollarOutlined /> Thanh toán
              </Title>
              <Descriptions column={1}>
                <Descriptions.Item label="Tiền ban đầu (đã giảm)">
                  {getFormattedPrice(detail.totalAmountAfter)}
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ bổ sung (chưa giảm)">
                  {getFormattedPrice(additionalAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="Dịch vụ bổ sung (đã giảm)">
                  {getFormattedPrice(additionalAfterDiscount)}
                </Descriptions.Item>

                <Descriptions.Item label="Tổng thanh toán">
                  <Text strong>{getFormattedPrice(totalPrice)}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* ---- Cancel Button ---- */}
            {detail.status === "BOOKED" && (
              <Card className="cancel-card section-card" bordered={false}>
                <Button danger type="primary" block onClick={handleCancelAppointment} style={{ fontWeight: 500 }}>
                  Hủy lịch Grooming
                </Button>
              </Card>
            )}

            {/* ---- Check-in ---- */}
            <Card className="image-card section-card" bordered={false}>
              <Title level={4}>
                <ClockCircleOutlined /> Check-in
              </Title>
              {detail.checkInImage ? (
                <Image src={detail.checkInImage} width="100%" />
              ) : detail.status === "BOOKED" ? (
                <Button icon={<UploadOutlined />} type="primary" block onClick={openCheckInModal}>
                  Tải ảnh Check-in
                </Button>
              ) : (
                <Text type="secondary" italic>
                  Chưa có ảnh check-in.
                </Text>
              )}

              {detail.status === "CHECKED_IN" && (
                <Button type="primary" block onClick={handleSetInProgress} style={{ marginTop: 12 }}>
                  Đang thực hiện
                </Button>
              )}
            </Card>
            <br />
            {/* ---- Check-out ---- */}
            {detail.status === "IN_PROGRESS" ? (
              <Card className="image-card section-card" bordered={false}>
                <Title level={4}>
                  <CheckCircleOutlined /> Check-out
                </Title>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleUploadCheckOut(file);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />} type="primary" block size="large" loading={checkoutUploading}>
                    Tải ảnh Check-out & Thanh toán
                  </Button>
                </Upload>
                <Text type="secondary" style={{ display: "block", textAlign: "center", marginTop: 8 }}>
                  (Chụp ảnh hamster sau khi hoàn tất dịch vụ)
                </Text>
              </Card>
            ) : (
              detail.checkoutImage && (
                <Card className="image-card section-card" bordered={false}>
                  <Title level={4}>
                    <CheckCircleOutlined /> Check-out
                  </Title>
                  <Image src={detail.checkoutImage} width="100%" />
                </Card>
              )
            )}
          </Col>
        </Row>

        {/* ---- Modal Check-in (thay thế toàn bộ phần Modal hiện tại) ---- */}
        <Modal
          title="Check-in Grooming"
          open={showCheckInModal}
          onCancel={handleCloseCheckInModal}
          onOk={handleCheckInConfirm}
          okText="Xác nhận Check-in"
          cancelText="Hủy"
          confirmLoading={uploading}
          okButtonProps={{
            disabled: fileList.length === 0 || (!detail?.staff && !selectedStaffForCheckIn),
          }}
        >
          {/* Upload giống ManageProduct: picture-card, preview modal */}
          <div style={{ marginBottom: 12 }}>
            <Text strong>Ảnh check-in</Text>

            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => {
                setFileList(newFileList);
                // đồng bộ checkInFile nếu muốn (không bắt buộc)
                const f = newFileList[0]?.originFileObj as File | undefined;
                setCheckInFile(f ?? null);
              }}
              onPreview={handlePreview}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 6 }}>Chọn ảnh</div>
                </div>
              )}
            </Upload>
          </div>

          {/* Preview modal để xem ảnh lớn */}
          <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)}>
            <img alt={previewTitle || "preview"} style={{ width: "100%" }} src={previewImage} />
          </Modal>

          <Divider />

          {/* Chọn / Hiển thị nhân viên */}
          <div>
            {detail?.staff ? (
              <>
                <Text strong>Nhân viên thực hiện:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue" style={{ fontSize: 14, padding: "4px 8px" }}>
                    {detail.staff.fullName}
                  </Tag>
                </div>
              </>
            ) : (
              <>
                <Text strong>Chọn nhân viên thực hiện:</Text>

                {assignLoading ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <Spin />
                  </div>
                ) : staffListForCheckIn.length === 0 ? (
                  <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                    Không có nhân viên rảnh trong khung giờ này
                  </Text>
                ) : (
                  <Radio.Group
                    onChange={(e) => setSelectedStaffForCheckIn(e.target.value)}
                    value={selectedStaffForCheckIn}
                    style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}
                  >
                    {staffListForCheckIn.map((staff) => (
                      <Radio key={staff.id} value={staff.id}>
                        {staff.fullName}
                      </Radio>
                    ))}
                  </Radio.Group>
                )}
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default HistoryGroomingDetail;
