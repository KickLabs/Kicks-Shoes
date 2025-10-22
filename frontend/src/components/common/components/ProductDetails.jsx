import axiosInstance from '@/services/axiosInstance';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  PlusOutlined,
  ShoppingOutlined,
  StarFilled,
  StarOutlined,
  TagsOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatPrice } from '../../../utils/StringFormat';
import { ActiveTabContext } from './ActiveTabContext';
import TabHeader from './TabHeader';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const DEFAULT_IMAGE_PATH = '/placeholder.svg?height=400&width=400';

const emptyProduct = {
  name: '',
  summary: '',
  description: '',
  brand: '',
  category: '',
  productType: '', // Default to shoes
  sku: '',
  tags: [],
  status: true,
  price: {
    regular: 0,
    discountPercent: 0,
    isOnSale: false,
  },
  stock: 0,
  sales: 0,
  variants: {
    sizes: [],
    colors: [],
  },
  inventory: [],
  mainImage: '',
  colorOptions: [], // <-- THAY ĐỔI: Quản lý ảnh ở đây
  rating: 0,
  isNew: false,
};

const brandOptions = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans'];

// Dynamic size options based on product type
const getSizeOptions = productType => {
  switch (productType) {
    case 'shoes':
      return Array.from({ length: 21 }, (_, i) => 30 + i);
    case 'clothing':
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
    case 'accessory':
      return ['OneSize'];
    default:
      return Array.from({ length: 21 }, (_, i) => 30 + i);
  }
};
const colorOptions = [
  { label: 'Black', value: 'Black', hex: '#000000' },
  { label: 'White', value: 'White', hex: '#FFFFFF' },
  { label: 'Red', value: 'Red', hex: '#FF0000' },
  { label: 'Blue', value: 'Blue', hex: '#0000FF' },
  { label: 'Green', value: 'Green', hex: '#008000' },
  { label: 'Yellow', value: 'Yellow', hex: '#FFFF00' },
  { label: 'Gray', value: 'Gray', hex: '#808080' },
  { label: 'Brown', value: 'Brown', hex: '#A52A2A' },
  { label: 'Navy', value: 'Navy', hex: '#000080' },
  { label: 'Pink', value: 'Pink', hex: '#FFC0CB' },
];

const STOCK_THRESHOLDS = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 10,
  MEDIUM_STOCK: 50,
  ITEM_LOW_STOCK: 5,
};

const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_&().,]+$/,
  },
  summary: {
    required: true,
    minLength: 10,
    maxLength: 200,
  },
  description: {
    required: true,
    minLength: 20,
    maxLength: 1000,
  },
  productType: {
    required: true,
  },
  price: {
    min: 0.01,
  },
  discount: {
    min: 0,
    max: 100,
  },
  tags: {
    maxCount: 10,
    maxLength: 20,
  },
  images: {
    maxCount: 10,
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
};

const validateField = (field, value, customRules = {}) => {
  const rules = { ...VALIDATION_RULES[field], ...customRules };
  const errors = [];

  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    const fieldNames = {
      name: 'Product name',
      summary: 'Product summary',
      description: 'Product description',
      productType: 'Product type',
      price: 'Price',
      discount: 'Discount',
    };
    errors.push(`${fieldNames[field] || field} is required`);
    return errors;
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.trim().length < rules.minLength) {
      const fieldNames = {
        name: 'Product name',
        summary: 'Product summary',
        description: 'Product description',
      };
      errors.push(`${fieldNames[field] || field} must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength && value.trim().length > rules.maxLength) {
      const fieldNames = {
        name: 'Product name',
        summary: 'Product summary',
        description: 'Product description',
      };
      errors.push(`${fieldNames[field] || field} must not exceed ${rules.maxLength} characters`);
    }
    if (rules.pattern && !rules.pattern.test(value.trim())) {
      errors.push(`Product name contains invalid characters`);
    }
  }

  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      const fieldNames = {
        price: 'Price',
        discount: 'Discount',
      };
      errors.push(`${fieldNames[field] || field} must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && value > rules.max) {
      const fieldNames = {
        price: 'Price',
        discount: 'Discount',
      };
      errors.push(`${fieldNames[field] || field} must not exceed ${rules.max}`);
    }
  }

  return errors;
};

const validateProduct = (product, isEdit = false, originalProduct = null) => {
  const errors = {};

  const nameErrors = validateField('name', product.name);
  if (nameErrors.length > 0) errors.name = nameErrors;

  const summaryErrors = validateField('summary', product.summary);
  if (summaryErrors.length > 0) errors.summary = summaryErrors;

  const descriptionErrors = validateField('description', product.description);
  if (descriptionErrors.length > 0) errors.description = descriptionErrors;

  const productTypeErrors = validateField('productType', product.productType);
  if (productTypeErrors.length > 0) errors.productType = productTypeErrors;

  if (!product.category) {
    errors.category = ['Category is required'];
  }
  if (!product.brand) {
    errors.brand = ['Brand is required'];
  }

  const priceErrors = validateField('price', product.price?.regular);
  if (priceErrors.length > 0) errors.price = priceErrors;

  const discountErrors = validateField('discount', product.price?.discountPercent);
  if (discountErrors.length > 0) errors.discount = discountErrors;

  if (product.tags && product.tags.length > VALIDATION_RULES.tags.maxCount) {
    errors.tags = [`Maximum ${VALIDATION_RULES.tags.maxCount} tags allowed`];
  }

  if (product.tags && product.tags.length !== new Set(product.tags).size) {
    errors.tags = [...(errors.tags || []), 'Duplicate tags are not allowed'];
  }

  // --- THAY ĐỔI LOGIC VALIDATE ẢNH ---
  if (!product.colorOptions || product.colorOptions.length === 0) {
    errors.colorOptions = ['At least one color with images is required'];
  } else if (product.colorOptions.some(opt => !opt.images || opt.images.length === 0)) {
    errors.colorOptions = ['All added colors must have at least one image'];
  }

  if (!product.mainImage) {
    errors.mainImage = ['A main image must be selected from the color gallery'];
  }
  // --- KẾT THÚC THAY ĐỔI ---

  if (!product.inventory || product.inventory.length === 0) {
    errors.inventory = ['At least one inventory item is required'];
  }

  // *** TẠM THỜI TẮT VALIDATE TRÙNG ***
  // (Vì logic mới sẽ cộng dồn chứ không báo lỗi)
  // if (product.inventory && product.inventory.length > 0) {
  //   const combinations = product.inventory.map(item => {
  //     const sizeKey =
  //       product.productType === 'shoes'
  //         ? item.size
  //         : product.productType === 'clothing'
  //           ? item.clothingSize
  //           : product.productType === 'accessory'
  //             ? 'OneSize'
  //             : item.size || item.clothingSize;
  //     return `${sizeKey}-${item.color}`;
  //   });
  //   if (combinations.length !== new Set(combinations).size) {
  //     errors.inventory = [
  //       ...(errors.inventory || []),
  //       'Duplicate size and color combinations found',
  //     ];
  //   }
  // }

  return errors;
};

const validateFile = file => {
  const errors = [];

  if (file.size > VALIDATION_RULES.images.maxSize) {
    errors.push('File size must be less than 5MB');
  }

  if (!VALIDATION_RULES.images.allowedTypes.includes(file.type)) {
    errors.push('Only JPG, PNG, and WebP files are allowed');
  }

  return errors;
};

const calculateTotalStock = inventory => {
  return inventory.reduce((total, item) => total + (item.quantity || 0), 0);
};

const updateVariantsFromInventory = (inventory, productType) => {
  let sizes = [];

  if (productType === 'shoes') {
    sizes = [...new Set(inventory.map(item => item.size).filter(Boolean))];
  } else if (productType === 'clothing') {
    sizes = [...new Set(inventory.map(item => item.clothingSize).filter(Boolean))];
  } else if (productType === 'accessory') {
    sizes = inventory.length > 0 ? ['OneSize'] : [];
  } else {
    // For 'other' type, try both size and clothingSize
    sizes = [
      ...new Set([
        ...inventory.map(item => item.size).filter(Boolean),
        ...inventory.map(item => item.clothingSize).filter(Boolean),
      ]),
    ];
  }

  const colors = [...new Set(inventory.map(item => item.color).filter(Boolean))];
  return { sizes, colors };
};

const calculateLowStockItems = inventory => {
  return inventory.filter(
    item => item.quantity > 0 && item.quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK
  );
};

const calculateOutOfStockItems = inventory => {
  return inventory.filter(item => item.quantity === 0);
};

const calculateAvailableItems = inventory => {
  return inventory.filter(item => item.quantity > 0);
};

export default function ProductDetails() {
  const { setActiveTab } = useContext(ActiveTabContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAddNew = location.pathname.includes('add-new');
  const isEdit = location.pathname.includes('/edit');
  const productId = isEdit ? location.pathname.split('/').slice(-2)[0] : null;

  const [product, setProduct] = useState(emptyProduct);
  const [originalProduct, setOriginalProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  // --- THAY ĐỔI STATE QUẢN LÝ ẢNH ---
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);

  // State mới cho modal quản lý màu sắc
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [editingColorOption, setEditingColorOption] = useState(null); // { color: 'Red', images: [...] }
  const [colorFileList, setColorFileList] = useState([]); // File list cho modal màu sắc
  const [colorForm] = Form.useForm();
  // --- KẾT THÚC THAY ĐỔI STATE ---

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [inventoryForm] = Form.useForm();

  const handleChange = (field, value) => {
    if (field === 'productType') {
      // When productType changes, clear inventory and reset variants
      const updatedProduct = {
        ...product,
        [field]: value,
        inventory: [],
        variants: { sizes: [], colors: [] },
        stock: 0,
      };
      setProduct(updatedProduct);
    } else {
      const updatedProduct = { ...product, [field]: value };
      setProduct(updatedProduct);
    }

    if (validationErrors[field]) {
      const fieldErrors = validateField(field, value);
      if (fieldErrors.length === 0) {
        const newErrors = { ...validationErrors };
        delete newErrors[field];
        setValidationErrors(newErrors);
      }
    }
  };

  const handleNestedChange = (parentField, childField, value) => {
    const updatedProduct = {
      ...product,
      [parentField]: {
        ...product[parentField],
        [childField]: value,
      },
    };
    setProduct(updatedProduct);

    if (parentField === 'price' && childField === 'regular' && validationErrors.price) {
      const priceErrors = validateField('price', value);
      if (priceErrors.length === 0) {
        const newErrors = { ...validationErrors };
        delete newErrors.price;
        setValidationErrors(newErrors);
      }
    }

    if (parentField === 'price' && childField === 'discountPercent' && validationErrors.discount) {
      const discountErrors = validateField('discount', value);
      if (discountErrors.length === 0) {
        const newErrors = { ...validationErrors };
        delete newErrors.discount;
        setValidationErrors(newErrors);
      }
    }
  };

  const uploadToCloud = useCallback(async ({ file, onSuccess, onError, onProgress }) => {
    const fileErrors = validateFile(file);
    if (fileErrors.length > 0) {
      message.error(fileErrors.join(', '));
      onError(new Error(fileErrors.join(', ')));
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axiosInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          onProgress({ percent: (e.loaded / e.total) * 100 }, file);
        },
      });
      const url = res.data.url;
      onSuccess(res.data, file);
      // Trả về URL để component tự quản lý
      return { ...res.data, url };
    } catch (err) {
      console.error('Upload error:', err);
      message.error('Failed to upload image');
      onError(err);
    }
  }, []);

  const getAuthHeaders = () => {
    const userInfo = localStorage.getItem('userInfo');
    const token = userInfo ? JSON.parse(userInfo).token : null;
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    setActiveTab('2');
    fetchInitialData();
  }, [setActiveTab, isAddNew, location.pathname]);

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      await fetchCategories();
      if (!isAddNew && productId) {
        await fetchProductDetails(productId);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      message.error('Failed to load initial data');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories?t=' + Date.now(), {
        headers: getAuthHeaders(),
      });
      if (response.data && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to fetch categories!');
    }
  };

  const fetchProductDetails = async productId => {
    try {
      const response = await axiosInstance.get('/products/' + productId + '?t=' + Date.now(), {
        headers: getAuthHeaders(),
      });
      if (response.data && response.data.data) {
        const productData = response.data.data;
        setOriginalProduct(productData);
        const calculatedStock = calculateTotalStock(productData.inventory || []);

        const processedProduct = {
          ...productData,
          stock: calculatedStock,
          colorOptions: productData.colorOptions || [], // <-- THAY ĐỔI
          mainImage: productData.mainImage || '',
          variants: productData.variants || { sizes: [], colors: [] },
          price: productData.price || { regular: 0, discountPercent: 0, isOnSale: false },
          productType: productData.productType || 'shoes', // Ensure productType is set
          category:
            typeof productData.category === 'object' && productData.category !== null
              ? productData.category._id
              : productData.category,
        };

        setProduct(processedProduct);
        // --- XÓA LOGIC setFileList CŨ ---
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      message.error('Failed to fetch product details!');
    }
  };

  useEffect(() => {
    const newStock = calculateTotalStock(product.inventory);
    const newVariants = updateVariantsFromInventory(product.inventory, product.productType);
    const updatedProduct = {
      ...product,
      stock: newStock,
      variants: newVariants,
    };
    // Dùng hàm setProduct để tránh vòng lặp vô hạn
    setProduct(prev => ({
      ...prev,
      stock: newStock,
      variants: newVariants,
    }));

    if (validationErrors.inventory && product.inventory.length > 0) {
      const newErrors = { ...validationErrors };
      delete newErrors.inventory;
      setValidationErrors(newErrors);
    }
  }, [product.inventory, product.productType]); // Bỏ 'product' khỏi dependencies

  const calculateSalePrice = () => {
    if (product.price.regular && product.price.discountPercent) {
      return product.price.regular * (1 - product.price.discountPercent / 100);
    }
    return product.price.regular;
  };

  // --- XÓA BỎ: handleUploadChange, handleInventoryImageUpload ---

  const openInventoryModal = item => {
    setEditingInventoryItem(item || null);
    if (item) {
      // EDIT MODE
      const formValues = {
        color: item.color,
        quantity: item.quantity, // Khi Edit, ta set số lượng tuyệt đối
      };
      if (product.productType === 'shoes') {
        formValues.size = item.size;
      } else if (product.productType === 'clothing') {
        formValues.size = item.clothingSize;
      } else if (product.productType === 'accessory') {
        formValues.size = 'OneSize';
      } else {
        formValues.size = item.size || item.clothingSize;
      }
      inventoryForm.setFieldsValue(formValues);
    } else {
      // ADD MODE
      inventoryForm.resetFields();
    }
    setInventoryModalVisible(true);
  };

  // --- HÀM CẬP NHẬT LOGIC "UPSERT" ---
  const handleInventorySubmit = async () => {
    try {
      const values = await inventoryForm.validateFields();
      const newQuantity = Number(values.quantity);

      if (!values.size || !values.color || newQuantity === undefined) {
        message.error('Please fill in all required fields');
        return;
      }
      if (newQuantity < 0) {
        message.error('Quantity cannot be negative');
        return;
      }

      // Tạo cấu trúc item
      const itemData = {
        color: values.color,
      };
      if (product.productType === 'shoes') {
        itemData.size = values.size;
      } else if (product.productType === 'clothing') {
        itemData.clothingSize = values.size;
      } else if (product.productType === 'accessory') {
        itemData.isOneSize = true;
      } else {
        itemData.size = values.size;
      }

      let updatedInventory;
      let successMessage = '';

      if (editingInventoryItem) {
        // --- EDIT MODE ---
        // Người dùng đang SỬA 1 item. Số lượng nhập là SỐ LƯỢNG MỚI.
        itemData.quantity = newQuantity;
        itemData.isAvailable = newQuantity > 0;

        updatedInventory = product.inventory.map(item => {
          const isSameSize =
            product.productType === 'shoes'
              ? item.size === editingInventoryItem.size
              : product.productType === 'clothing'
                ? item.clothingSize === editingInventoryItem.clothingSize
                : product.productType === 'accessory'
                  ? item.isOneSize === editingInventoryItem.isOneSize
                  : item.size === editingInventoryItem.size;

          return isSameSize && item.color === editingInventoryItem.color
            ? { ...item, ...itemData } // Giữ lại SKU và các trường cũ, ghi đè trường mới
            : item;
        });
        successMessage = 'Inventory item updated!';
      } else {
        // --- ADD MODE (LOGIC MỚI) ---
        // Người dùng đang THÊM MỚI. Số lượng nhập là SỐ LƯỢNG CẦN CỘNG THÊM.
        const quantityToAdd = newQuantity;

        if (quantityToAdd === 0) {
          message.info('Quantity to add is 0. No changes made.');
          setInventoryModalVisible(false);
          return;
        }

        const existingItem = product.inventory.find(item => {
          const isSameSize =
            product.productType === 'shoes'
              ? item.size === values.size
              : product.productType === 'clothing'
                ? item.clothingSize === values.size
                : product.productType === 'accessory'
                  ? item.isOneSize === true
                  : item.size === values.size;
          return isSameSize && item.color === values.color;
        });

        if (existingItem) {
          // TÌM THẤY: Cộng dồn số lượng
          const finalQuantity = (existingItem.quantity || 0) + quantityToAdd;
          updatedInventory = product.inventory.map(item =>
            item === existingItem
              ? {
                  ...item,
                  quantity: finalQuantity,
                  isAvailable: finalQuantity > 0,
                }
              : item
          );
          successMessage = `Added ${quantityToAdd} units to ${values.color}/${values.size}. New total: ${finalQuantity}.`;
        } else {
          // KHÔNG TÌM THẤY: Tạo item mới
          const newItem = {
            ...itemData,
            quantity: quantityToAdd,
            isAvailable: quantityToAdd > 0,
          };
          updatedInventory = [...product.inventory, newItem];
          successMessage = `New item (${values.color}/${values.size}) added with ${quantityToAdd} units.`;
        }
      }

      // Cập nhật state (sẽ kích hoạt useEffect để tính lại tổng stock)
      setProduct(prev => ({
        ...prev,
        inventory: updatedInventory,
      }));

      setInventoryModalVisible(false);
      setEditingInventoryItem(null);
      inventoryForm.resetFields();
      message.success(successMessage);
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Please check all required fields');
    }
  };
  // --- KẾT THÚC HÀM CẬP NHẬT ---

  const deleteInventoryItem = (size, color) => {
    const updatedInventory = product.inventory.filter(item => {
      // Compare based on product type
      const isSameSize =
        product.productType === 'shoes'
          ? item.size === size
          : product.productType === 'clothing'
            ? item.clothingSize === size
            : product.productType === 'accessory'
              ? item.isOneSize === true
              : item.size === size;

      return !(isSameSize && item.color === color);
    });
    const updatedProduct = {
      ...product,
      inventory: updatedInventory,
    };
    setProduct(updatedProduct);
    message.success('Inventory item deleted! Variants auto-updated.');
  };

  // --- HÀM MỚI: Xử lý Color Option Modal ---
  const openColorModal = colorOption => {
    if (colorOption) {
      // Edit
      setEditingColorOption(colorOption);
      colorForm.setFieldsValue({
        color: colorOption.color,
      });
      // Hiển thị ảnh cũ
      setColorFileList(
        colorOption.images.map((img, idx) => ({
          uid: `${colorOption.color}-${idx}`,
          name: `Image ${idx + 1}.png`,
          status: 'done',
          url: img,
        }))
      );
    } else {
      // Add new
      setEditingColorOption(null);
      colorForm.resetFields();
      setColorFileList([]);
    }
    setColorModalVisible(true);
  };

  const handleColorModalSubmit = async () => {
    try {
      const values = await colorForm.validateFields();
      const color = values.color;

      if (!editingColorOption && product.colorOptions.find(opt => opt.color === color)) {
        message.error('This color has already been added. Please edit the existing one.');
        return;
      }

      if (colorFileList.length === 0) {
        message.error('You must upload at least one image for this color.');
        return;
      }

      const uploadedImages = colorFileList
        .map(file => file.url || file.response.url)
        .filter(Boolean);

      const newColorOption = {
        color: color,
        images: uploadedImages,
        colorMainImage: uploadedImages[0], // Tự động đặt ảnh đầu tiên làm ảnh đại diện màu
      };

      let updatedColorOptions;
      if (editingColorOption) {
        // Update
        updatedColorOptions = product.colorOptions.map(opt =>
          opt.color === editingColorOption.color ? newColorOption : opt
        );
      } else {
        // Add new
        updatedColorOptions = [...product.colorOptions, newColorOption];
      }

      // Tự động set mainImage cho toàn bộ sản phẩm nếu chưa có
      let newMainImage = product.mainImage;
      if (
        !newMainImage &&
        updatedColorOptions.length > 0 &&
        updatedColorOptions[0].images.length > 0
      ) {
        newMainImage = updatedColorOptions[0].images[0];
      }

      setProduct(prev => ({
        ...prev,
        colorOptions: updatedColorOptions,
        mainImage: newMainImage,
      }));

      setColorModalVisible(false);
      message.success(editingColorOption ? 'Color option updated!' : 'Color option added!');
    } catch (error) {
      console.error('Color modal validation failed:', error);
      message.error('Please check all required fields.');
    }
  };

  const deleteColorOption = color => {
    Modal.confirm({
      title: 'Delete this color gallery?',
      content: `Are you sure you want to delete all images for the color "${color}"?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: () => {
        const updatedColorOptions = product.colorOptions.filter(opt => opt.color !== color);
        let newMainImage = product.mainImage;

        // Nếu ảnh chính thuộc về màu bị xóa, hãy chọn 1 ảnh khác
        if (newMainImage && !updatedColorOptions.some(opt => opt.images.includes(newMainImage))) {
          newMainImage =
            updatedColorOptions.length > 0 && updatedColorOptions[0].images.length > 0
              ? updatedColorOptions[0].images[0]
              : '';
        }

        setProduct(prev => ({
          ...prev,
          colorOptions: updatedColorOptions,
          mainImage: newMainImage,
        }));
        message.success(`Color "${color}" and its images have been deleted.`);
      },
    });
  };

  // --- HÀM MỚI: Set Main Image ---
  const setAsMainImage = imageUrl => {
    setProduct(prev => ({
      ...prev,
      mainImage: imageUrl,
    }));
    message.success('Main image updated!');
  };

  const getStockStatus = () => {
    const stock = product.stock;
    if (stock === STOCK_THRESHOLDS.OUT_OF_STOCK) {
      return {
        status: 'error',
        text: 'Out of Stock',
        color: '#ff4d4f',
        icon: <ExclamationCircleOutlined />,
      };
    }
    if (stock <= STOCK_THRESHOLDS.LOW_STOCK) {
      return { status: 'warning', text: 'Low Stock', color: '#faad14', icon: <WarningOutlined /> };
    }
    if (stock <= STOCK_THRESHOLDS.MEDIUM_STOCK) {
      return { status: 'normal', text: 'In Stock', color: '#1890ff', icon: <InfoCircleOutlined /> };
    }
    return {
      status: 'success',
      text: 'Well Stocked',
      color: '#52c41a',
      icon: <CheckCircleOutlined />,
    };
  };

  const handleCreate = async () => {
    setValidationErrors({});

    const errors = validateProduct(product, false, null);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      message.error('Please fix all validation errors before creating the product');

      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      const userInfo = localStorage.getItem('userInfo');
      const token = userInfo ? JSON.parse(userInfo).token : null;

      const payload = {
        name: product.name.trim(),
        summary: product.summary.trim(),
        description: product.description.trim(),
        brand: product.brand,
        category: product.category,
        productType: product.productType || 'shoes', // Include productType
        price: {
          regular: Number(product.price.regular) || 0,
          discountPercent: Number(product.price.discountPercent) || 0,
          isOnSale: Boolean(product.price.isOnSale),
        },
        variants: {
          sizes: product.variants.sizes || [],
          colors: product.variants.colors || [],
        },
        inventory: product.inventory || [],
        colorOptions: product.colorOptions || [], // <-- THAY ĐỔI
        mainImage: product.mainImage || '',
        tags: product.tags || [],
        status: product.status,
        stock: product.stock || 0,
        isNew: product.isNew,
      };

      console.log('Creating product with payload:', payload);
      const response = await axiosInstance.post('/products/add', payload);
      message.success('Product created successfully!');

      setTimeout(() => {
        window.location.href = '/shop/products';
      }, 1000);
    } catch (err) {
      console.error('Create product error:', err);
      message.error(`Failed to create product: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setValidationErrors({});

    const errors = validateProduct(product, true, originalProduct);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      message.error('Please fix all validation errors before updating the product');

      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      const userInfo = localStorage.getItem('userInfo');
      const token = userInfo ? JSON.parse(userInfo).token : null;
      const productId = product._id || product.id;

      const payload = {
        ...originalProduct,
        name: product.name.trim(),
        summary: product.summary.trim(),
        description: product.description.trim(),
        brand: product.brand,
        category: product.category,
        productType: product.productType || 'shoes', // Include productType for update
        price: {
          regular: Number(product.price.regular) || 0,
          discountPercent: Number(product.price.discountPercent) || 0,
          isOnSale: Boolean(product.price.isOnSale),
        },
        variants: {
          sizes: product.variants.sizes || [],
          colors: product.variants.colors || [],
        },
        inventory: product.inventory || [],
        colorOptions: product.colorOptions || [], // <-- THAY ĐỔI
        mainImage: product.mainImage || '',
        tags: product.tags || [],
        status: product.status,
        stock: product.stock || 0,
        isNew: product.isNew,
      };

      console.log('Updating product with payload:', payload);
      const response = await axiosInstance.put('/products/' + productId, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      message.success('Product updated successfully!');
      setTimeout(() => {
        window.location.href = '/shop/products';
      }, 1000);
    } catch (err) {
      console.error('Update product error:', err);
      message.error(`Failed to update product: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const userInfo = localStorage.getItem('userInfo');
      const token = userInfo ? JSON.parse(userInfo).token : null;
      const productId = product._id || product.id;

      await axiosInstance.delete('/products/' + productId + '/delete', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      message.success('Product deleted successfully!');
      setTimeout(() => {
        window.location.href = '/shop/products';
      }, 1000);
    } catch (err) {
      console.error('Delete product error:', err);
      message.error(`Failed to delete product: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    message.info('Changes canceled');
    window.location.href = '/shop/products';
  };

  const inventoryColumns = [
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size, record) => {
        let displaySize = '';
        if (product.productType === 'shoes') displaySize = record.size;
        else if (product.productType === 'clothing') displaySize = record.clothingSize;
        else if (product.productType === 'accessory') displaySize = 'OneSize';
        else displaySize = record.size || record.clothingSize || 'N/A';
        return (
          <Tag color="blue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {displaySize}
          </Tag>
        );
      },
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: color => {
        const colorOption = colorOptions.find(opt => opt.value === color); // Use static list for hex
        return (
          <Space>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: colorOption?.hex || '#ccc',
                border: '2px solid #d9d9d9',
                borderRadius: 4,
              }}
            />
            <Text strong>{color}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: quantity => (
        <div style={{ textAlign: 'center' }}>
          <Badge
            count={quantity}
            style={{
              backgroundColor:
                quantity > STOCK_THRESHOLDS.ITEM_LOW_STOCK
                  ? '#52c41a'
                  : quantity > 0
                    ? '#faad14'
                    : '#ff4d4f',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '40px',
              height: '24px',
              lineHeight: '24px',
            }}
          />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (isAvailable, record) => {
        const quantity = record.quantity;
        if (quantity === 0)
          return (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              Out of Stock
            </Tag>
          );
        if (quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK)
          return (
            <Tag color="orange" icon={<WarningOutlined />}>
              Low Stock
            </Tag>
          );
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            In Stock
          </Tag>
        );
      },
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: sku => <Text type="secondary">{sku || 'Auto-generated'}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Quantity/Details">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openInventoryModal(record)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete inventory item?"
            description="Are you sure? This action cannot be undone."
            onConfirm={() =>
              deleteInventoryItem(record.size || record.clothingSize || 'OneSize', record.color)
            }
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Item">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stockStatus = getStockStatus();
  const lowStockItems = calculateLowStockItems(product.inventory);
  const outOfStockItems = calculateOutOfStockItems(product.inventory);
  const availableItems = calculateAvailableItems(product.inventory);

  if (pageLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <TabHeader
        breadcrumb="All Products"
        anotherBreadcrumb={isAddNew ? 'Add New Product' : 'Edit Product'}
      />
      <div className="product-details-container" style={{ padding: '24px', background: '#f5f5f5' }}>
        {product.stock <= STOCK_THRESHOLDS.LOW_STOCK && (
          <Alert
            message={
              <Space>
                {stockStatus.icon}
                <span>
                  <strong>{stockStatus.text}:</strong> Only {product.stock} items remaining
                  {lowStockItems.length > 0 && ` (${lowStockItems.length} items low stock)`}
                  {outOfStockItems.length > 0 && ` (${outOfStockItems.length} items out of stock)`}
                </span>
              </Space>
            }
            type={stockStatus.status}
            showIcon={false}
            style={{ marginBottom: 24, borderRadius: 8 }}
            action={
              <Space>
                <Button size="small" type="primary" onClick={() => openInventoryModal()}>
                  Add Stock
                </Button>
                <Tooltip title="View low stock items">
                  <Button size="small" type="default" icon={<WarningOutlined />}>
                    {lowStockItems.length} Low
                  </Button>
                </Tooltip>
              </Space>
            }
          />
        )}

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>Basic Information</span>
                </Space>
              }
              variant="borderless"
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Row gutter={[16, 24]}>
                <Col span={24} data-field="name">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    <span style={{ color: 'red' }}>*</span> Product Name
                  </label>
                  <Input
                    size="large"
                    placeholder="Enter product name (3-100 characters)"
                    value={product.name}
                    onChange={e => handleChange('name', e.target.value)}
                    status={validationErrors.name ? 'error' : ''}
                    maxLength={100}
                    showCount
                  />
                  {validationErrors.name && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.name.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col span={24} data-field="summary">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    <span style={{ color: 'red' }}>*</span> Product Summary
                  </label>
                  <Input
                    size="large"
                    placeholder="Brief product summary (10-200 characters)"
                    value={product.summary}
                    onChange={e => handleChange('summary', e.target.value)}
                    status={validationErrors.summary ? 'error' : ''}
                    maxLength={200}
                    showCount
                  />
                  {validationErrors.summary && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.summary.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col span={24} data-field="description">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    <span style={{ color: 'red' }}>*</span> Product Description
                  </label>
                  <TextArea
                    placeholder="Detailed product description (20-1000 characters)"
                    value={product.description}
                    onChange={e => handleChange('description', e.target.value)}
                    rows={4}
                    style={{ resize: 'none' }}
                    status={validationErrors.description ? 'error' : ''}
                    maxLength={1000}
                    showCount
                  />
                  {validationErrors.description && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.description.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12} data-field="category">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    <span style={{ color: 'red' }}>*</span> Category
                  </label>
                  <Select
                    size="large"
                    placeholder="Select a category"
                    value={product.category}
                    onChange={value => handleChange('category', value)}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                    status={validationErrors.category ? 'error' : ''}
                  >
                    {categories.map(cat => (
                      <Option key={cat._id} value={cat._id}>
                        {cat.name}
                      </Option>
                    ))}
                  </Select>
                  {validationErrors.category && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.category.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12} data-field="brand">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    <span style={{ color: 'red' }}>*</span> Brand
                  </label>
                  <Select
                    size="large"
                    placeholder="Select a brand"
                    value={product.brand}
                    onChange={value => handleChange('brand', value)}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                    status={validationErrors.brand ? 'error' : ''}
                  >
                    {brandOptions.map(brand => (
                      <Option key={brand} value={brand}>
                        {brand}
                      </Option>
                    ))}
                  </Select>
                  {validationErrors.brand && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.brand.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12} data-field="productType">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    <span style={{ color: 'red' }}>*</span> Product Type
                  </label>
                  <Select
                    size="large"
                    placeholder="Select product type"
                    value={product.productType}
                    onChange={value => handleChange('productType', value)}
                    style={{ width: '100%' }}
                    status={validationErrors.productType ? 'error' : ''}
                  >
                    <Option value="shoes">Shoes</Option>
                    <Option value="clothing">Clothing</Option>
                    <Option value="accessory">Accessory</Option>
                    <Option value="other">Other</Option>
                  </Select>
                  {validationErrors.productType && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.productType.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Total Stock Quantity (Auto-calculated)
                  </label>
                  <div
                    style={{
                      padding: '12px 16px',
                      background: stockStatus.color + '15',
                      border: `2px solid ${stockStatus.color}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: '18px', color: stockStatus.color }}>
                        {product.stock} units
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {stockStatus.text}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: stockStatus.color, fontSize: '20px' }}>
                        {stockStatus.icon}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* --- CARD MỚI: COLOR & IMAGE GALLERY --- */}
            <Card
              title={
                <Space>
                  <PictureOutlined />
                  <span>Color & Image Gallery</span>
                  <Badge
                    count={product.colorOptions.length}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                </Space>
              }
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openColorModal(null)}>
                  Add Color
                </Button>
              }
              variant="borderless"
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              data-field="colorOptions"
            >
              {validationErrors.colorOptions && (
                <Alert
                  message="Image Gallery Error"
                  description={validationErrors.colorOptions.join(', ')}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              {validationErrors.mainImage && (
                <Alert
                  message="Main Image Error"
                  description={validationErrors.mainImage.join(', ')}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              {product.colorOptions.length === 0 ? (
                <Empty
                  description={
                    <span>
                      No colors added yet.
                      <br />
                      Click "Add Color" to upload images for each product color.
                    </span>
                  }
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {product.colorOptions.map(opt => {
                    const colorHex = colorOptions.find(c => c.value === opt.color)?.hex || '#ccc';
                    return (
                      <Card
                        key={opt.color}
                        size="small"
                        style={{ background: '#fafafa', borderRadius: 8 }}
                      >
                        <Row align="middle" gutter={16}>
                          <Col flex="auto">
                            <Space>
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  backgroundColor: colorHex,
                                  border: '1px solid #d9d9d9',
                                  borderRadius: 4,
                                }}
                              />
                              <Text strong style={{ fontSize: 16 }}>
                                {opt.color}
                              </Text>
                              <Badge
                                count={`${opt.images.length} images`}
                                style={{ backgroundColor: '#52c41a' }}
                              />
                            </Space>
                          </Col>
                          <Col flex="none">
                            <Space>
                              <Button icon={<EditOutlined />} onClick={() => openColorModal(opt)}>
                                Edit
                              </Button>
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => deleteColorOption(opt.color)}
                              >
                                Delete
                              </Button>
                            </Space>
                          </Col>
                        </Row>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 12,
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: '1px solid #f0f0f0',
                          }}
                        >
                          {opt.images.map(img => (
                            <div
                              key={img}
                              style={{ position: 'relative', cursor: 'pointer' }}
                              onClick={() => setAsMainImage(img)}
                            >
                              <Image
                                width={100}
                                height={100}
                                src={img}
                                fallback={DEFAULT_IMAGE_PATH}
                                style={{
                                  borderRadius: 8,
                                  border:
                                    product.mainImage === img
                                      ? '4px solid #1890ff'
                                      : '4px solid transparent',
                                  objectFit: 'cover',
                                }}
                                preview={false}
                              />
                              {product.mainImage === img && (
                                <Tooltip title="Main Image">
                                  <StarFilled
                                    style={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      fontSize: 20,
                                      color: '#1890ff',
                                      background: 'white',
                                      borderRadius: '50%',
                                      padding: 4,
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </Card>

            {/* Pricing */}
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Pricing & Sales</span>
                </Space>
              }
              variant="borderless"
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Row gutter={[16, 24]}>
                <Col xs={24} sm={12} data-field="price">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    <span style={{ color: 'red' }}>*</span> Price (VNĐ)
                  </label>
                  <InputNumber
                    size="large"
                    style={{ width: '100%' }}
                    min={0}
                    value={product.price.regular}
                    onChange={value => handleNestedChange('price', 'regular', value)}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫'}
                    parser={value => value.replace(/\₫\s?|(,*)/g, '')}
                    status={validationErrors.price ? 'error' : ''}
                  />
                  {validationErrors.price && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.price.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>

                <Col xs={24} sm={12} data-field="discount">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Discount Percentage (%)
                  </label>
                  <InputNumber
                    size="large"
                    placeholder="0"
                    min={0}
                    max={100}
                    value={product.price.discountPercent}
                    onChange={value => handleNestedChange('price', 'discountPercent', value || 0)}
                    style={{ width: '100%' }}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    status={validationErrors.discount ? 'error' : ''}
                  />
                  {validationErrors.discount && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.discount.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                      On Sale
                    </label>
                    <Switch
                      checked={product.price.isOnSale}
                      onChange={checked => handleNestedChange('price', 'isOnSale', checked)}
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Sale Price (₫)
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#f0f0f0',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#52c41a',
                    }}
                  >
                    {formatPrice(calculateSalePrice())}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <Space>
                  <TagsOutlined />
                  <span>Product Variants (Auto-Generated from Inventory)</span>
                </Space>
              }
              variant="borderless"
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Row gutter={[16, 24]}>
                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Available Sizes (Auto-generated from Inventory)
                  </label>
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      border: '2px dashed #d9d9d9',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    {product.variants.sizes.length > 0 ? (
                      product.variants.sizes.map(size => (
                        <Tag
                          key={size}
                          color="blue"
                          style={{ fontSize: '12px', fontWeight: 'bold' }}
                        >
                          {product.productType === 'shoes' ? `Size ${size}` : size}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary" style={{ fontStyle: 'italic' }}>
                        No sizes available. Add inventory items to populate sizes automatically.
                      </Text>
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Available Colors (Auto-generated from Inventory)
                  </label>
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      border: '2px dashed #d9d9d9',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    {product.variants.colors.length > 0 ? (
                      product.variants.colors.map(color => {
                        const colorOption = colorOptions.find(opt => opt.value === color);
                        return (
                          <Tag
                            key={color}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          >
                            <div
                              style={{
                                width: 14,
                                height: 14,
                                backgroundColor: colorOption?.hex || '#ccc',
                                border: '1px solid #d9d9d9',
                                borderRadius: 2,
                              }}
                            />
                            {color}
                          </Tag>
                        );
                      })
                    ) : (
                      <Text type="secondary" style={{ fontStyle: 'italic' }}>
                        No colors available. Add inventory items to populate colors automatically.
                      </Text>
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <Alert
                    message="Variants Auto-Update"
                    description="Available sizes and colors are automatically generated based on your inventory items. Add inventory items to see variants appear here."
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Inventory Management */}
            <Card
              title={
                <Space>
                  <ShoppingOutlined />
                  <span>Inventory Management</span>
                  <Badge count={product.inventory.length} style={{ backgroundColor: '#1890ff' }} />
                  {lowStockItems.length > 0 && (
                    <Badge count={lowStockItems.length} style={{ backgroundColor: '#faad14' }} />
                  )}
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openInventoryModal(null)} // Luôn mở ở chế độ "Add" (null)
                  size="large"
                >
                  Add Stock
                </Button>
              }
              variant="borderless"
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              data-field="inventory"
            >
              {validationErrors.inventory && (
                <Alert
                  message="Inventory Error"
                  description={validationErrors.inventory.join(', ')}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Stock Overview */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                    <Statistic
                      title="Total Stock"
                      value={product.stock}
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      suffix="units"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                    <Statistic
                      title="Well Stocked"
                      value={availableItems.length}
                      valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                      suffix="items"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                    <Statistic
                      title="Low Stock"
                      value={lowStockItems.length}
                      valueStyle={{ color: '#faad14', fontSize: '24px' }}
                      suffix="items"
                      prefix={<WarningOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: 'center', background: '#fff2f0' }}>
                    <Statistic
                      title="Out of Stock"
                      value={outOfStockItems.length}
                      valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                      suffix="items"
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Table
                columns={inventoryColumns}
                dataSource={product.inventory}
                rowKey={record => {
                  const sizeKey =
                    product.productType === 'shoes'
                      ? record.size
                      : product.productType === 'clothing'
                        ? record.clothingSize
                        : product.productType === 'accessory'
                          ? 'OneSize'
                          : record.size || record.clothingSize;
                  return `${sizeKey}-${record.color}`;
                }}
                pagination={false}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: "No inventory items added yet. Click 'Add Stock' to get started.",
                }}
                size="middle"
                rowClassName={record => {
                  if (record.quantity === 0) return 'out-of-stock-row';
                  if (record.quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK) return 'low-stock-row';
                  return '';
                }}
              />
            </Card>

            {/* Additional Information */}
            <Card
              title={
                <Space>
                  <TagsOutlined />
                  <span>Additional Information</span>
                </Space>
              }
              variant="borderless"
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Row gutter={[16, 24]}>
                <Col span={24} data-field="tags">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Product Tags (Max 10 tags)
                  </label>
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Add tags (press Enter to add)"
                    value={product.tags}
                    onChange={tags => handleChange('tags', tags)}
                    style={{ width: '100%' }}
                    status={validationErrors.tags ? 'error' : ''}
                    maxTagCount={10}
                  />
                  {validationErrors.tags && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                        {validationErrors.tags.join(', ')}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                      Product Status
                    </label>
                    <Switch
                      checked={product.status}
                      onChange={checked => handleChange('status', checked)}
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                      New Product
                    </label>
                    <Switch
                      checked={product.isNew}
                      onChange={checked => handleChange('isNew', checked)}
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            {/* --- CARD MỚI: HIỂN THỊ MAIN IMAGE --- */}
            <Card
              title={
                <Space>
                  <StarOutlined />
                  <span>Main Product Image</span>
                </Space>
              }
              variant="borderless"
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: 24,
              }}
              data-field="mainImage"
            >
              <Image
                width="100%"
                src={product.mainImage || DEFAULT_IMAGE_PATH}
                fallback={DEFAULT_IMAGE_PATH}
                style={{ borderRadius: 8 }}
              />
              <Text
                type="secondary"
                style={{ textAlign: 'center', display: 'block', marginTop: 8 }}
              >
                Select an image from the "Color & Image Gallery" to set it as the main image.
              </Text>
            </Card>
            {/* --- XÓA BỎ CARD: PRODUCT GALLERY CŨ --- */}
          </Col>
        </Row>

        {/* Action Buttons */}
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            marginTop: 24,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Space size="large">
            {isAddNew ? (
              <Button
                type="primary"
                size="large"
                onClick={handleCreate}
                loading={loading}
                style={{
                  minWidth: 120,
                  height: 48,
                }}
              >
                Create Product
              </Button>
            ) : (
              <>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleUpdate}
                  loading={loading}
                  style={{
                    minWidth: 120,
                    height: 48,
                  }}
                >
                  Update Product
                </Button>
                <Popconfirm
                  title="Delete Product"
                  description="Are you sure you want to delete this product? This action cannot be undone."
                  onConfirm={handleDelete}
                  okText="Yes, Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    size="large"
                    loading={loading}
                    style={{
                      minWidth: 120,
                      height: 48,
                      backgroundColor: '#ff4d4f',
                      borderColor: '#ff4d4f',
                      color: '#ffffff',
                    }}
                    onMouseEnter={e => {
                      e.target.style.backgroundColor = '#ff7875';
                      e.target.style.borderColor = '#ff7875';
                    }}
                    onMouseLeave={e => {
                      e.target.style.backgroundColor = '#ff4d4f';
                      e.target.style.borderColor = '#ff4d4f';
                    }}
                  >
                    Delete Product
                  </Button>
                </Popconfirm>
              </>
            )}
            <Button size="large" onClick={handleCancel} style={{ minWidth: 120, height: 48 }}>
              Cancel
            </Button>
          </Space>
          {Object.keys(validationErrors).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Please fix validation errors to enable form submission
              </Text>
            </div>
          )}
        </Card>

        {/* --- MODAL INVENTORY (CẬP NHẬT GIAO DIỆN) --- */}
        <Modal
          title={
            <Space>
              <ShoppingOutlined />
              {/* Thay đổi tiêu đề dựa trên chế độ */}
              {editingInventoryItem ? 'Edit Inventory Item' : 'Add Stock to Inventory'}
            </Space>
          }
          open={inventoryModalVisible}
          onOk={handleInventorySubmit}
          onCancel={() => {
            setInventoryModalVisible(false);
            setEditingInventoryItem(null);
            inventoryForm.resetFields();
          }}
          width={600}
          okText={editingInventoryItem ? 'Update Item' : 'Add Stock'}
        >
          <Form form={inventoryForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="size"
                  label="Size"
                  rules={[{ required: true, message: 'Please select a size!' }]}
                >
                  <Select
                    placeholder="Select size"
                    size="large"
                    disabled={!!editingInventoryItem} // Không cho sửa Size/Color khi Edit
                  >
                    {getSizeOptions(product.productType).map(size => (
                      <Option key={size} value={size}>
                        {product.productType === 'shoes' ? `Size ${size}` : size}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="color"
                  label="Color"
                  rules={[{ required: true, message: 'Please select a color!' }]}
                >
                  {/* --- UPDATED: Dynamic Color Options --- */}
                  <Select
                    placeholder="Select color from gallery" // Updated placeholder
                    size="large"
                    disabled={!!editingInventoryItem} // Keep disabled logic for edit mode
                  >
                    {/* Map through colors defined in the product's gallery */}
                    {product.colorOptions.map(opt => {
                      // Find the static color info (like hex) for display
                      const staticColorInfo = colorOptions.find(c => c.value === opt.color);
                      return (
                        <Option key={opt.color} value={opt.color}>
                          <Space>
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                backgroundColor: staticColorInfo?.hex || '#ccc', // Use hex from static list
                                border: '1px solid #d9d9d9',
                                borderRadius: 4,
                              }}
                            />
                            {opt.color} {/* Display the color name */}
                          </Space>
                        </Option>
                      );
                    })}
                  </Select>
                  {/* --- END OF UPDATE --- */}
                </Form.Item>
              </Col>
            </Row>

            {/* --- CẬP NHẬT TRƯỜNG QUANTITY --- */}
            <Form.Item
              name="quantity"
              label={editingInventoryItem ? 'Set New Total Quantity' : 'Quantity to Add'}
              rules={[
                { required: true, message: 'Please enter quantity!' },
                {
                  type: 'number',
                  min: editingInventoryItem ? 0 : 1, // Khi edit cho phép set = 0, khi add phải > 0
                  max: 10000,
                  message: editingInventoryItem
                    ? 'Quantity must be between 0 and 10,000'
                    : 'Quantity to add must be between 1 and 10,000',
                },
              ]}
              extra={
                editingInventoryItem
                  ? `Set the new TOTAL stock for this item (e.g., set to ${STOCK_THRESHOLDS.LOW_STOCK} units).`
                  : `This will be ADDED to existing stock (e.g., add ${STOCK_THRESHOLDS.MEDIUM_STOCK} units).`
              }
            >
              <InputNumber
                placeholder={
                  editingInventoryItem ? 'Enter new total quantity' : 'Enter quantity to add'
                }
                min={0}
                max={10000}
                style={{ width: '100%' }}
                size="large"
                formatter={value => `${value} units`}
                parser={value => value.replace(' units', '')}
              />
            </Form.Item>
            {/* --- KẾT THÚC CẬP NHẬT --- */}
          </Form>
        </Modal>

        {/* --- MODAL MỚI: QUẢN LÝ MÀU SẮC & ẢNH --- */}
        <Modal
          title={
            <Space>
              <PictureOutlined />
              {editingColorOption ? 'Edit Color Gallery' : 'Add New Color Gallery'}
            </Space>
          }
          open={colorModalVisible}
          onOk={handleColorModalSubmit}
          onCancel={() => setColorModalVisible(false)}
          width={700}
          okText={editingColorOption ? 'Update Color' : 'Add Color'}
        >
          <Form form={colorForm} layout="vertical">
            <Form.Item
              name="color"
              label="Color"
              rules={[{ required: true, message: 'Please select a color!' }]}
            >
              <Select
                placeholder="Select color"
                size="large"
                disabled={!!editingColorOption} // Không cho sửa màu (chỉ cho sửa ảnh)
              >
                {colorOptions.map(color => (
                  <Option key={color.value} value={color.value}>
                    <Space>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: color.hex,
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                        }}
                      />
                      {color.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="images"
              label="Images for this Color"
              extra={`Upload multiple images for this specific color. The first image will be the default. (Max ${VALIDATION_RULES.images.maxCount} images)`}
              rules={[
                {
                  validator: () =>
                    colorFileList.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('Please upload at least one image!')),
                },
              ]}
            >
              <Upload.Dragger
                fileList={colorFileList}
                customRequest={async options => {
                  const { file, onSuccess, onError, onProgress } = options;
                  const res = await uploadToCloud({ file, onSuccess, onError, onProgress });
                  if (res && res.url) {
                    // Cập nhật fileList state của modal
                    setColorFileList(prevList => [
                      ...prevList,
                      {
                        uid: file.uid,
                        name: file.name,
                        status: 'done',
                        url: res.url,
                        response: { url: res.url }, // Lưu url trong response
                      },
                    ]);
                  }
                }}
                onRemove={file => {
                  setColorFileList(prev => prev.filter(f => f.uid !== file.uid));
                  return true;
                }}
                listType="picture-card"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                beforeUpload={file => {
                  const errors = validateFile(file);
                  if (errors.length > 0) {
                    message.error(errors.join(', '));
                    return Upload.LIST_IGNORE;
                  }
                  if (colorFileList.length >= VALIDATION_RULES.images.maxCount) {
                    message.error(`Maximum ${VALIDATION_RULES.images.maxCount} images allowed.`);
                    return Upload.LIST_IGNORE;
                  }
                  return true;
                }}
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </Modal>

        {/* Custom CSS for row highlighting */}
        <style>{`
          .low-stock-row {
            background-color: #fff7e6 !important;
          }
          .out-of-stock-row {
            background-color: #fff2f0 !important;
          }
        `}</style>
      </div>
    </div>
  );
}
