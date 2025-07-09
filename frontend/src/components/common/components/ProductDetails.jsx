// import { useState, useEffect, useContext } from 'react';
// import { formatPrice } from '../../../utils/StringFormat';
// import {
//   DeleteOutlined,
//   PlusOutlined,
//   InfoCircleOutlined,
//   DollarOutlined,
//   TagsOutlined,
//   PictureOutlined,
//   EditOutlined,
//   ShoppingOutlined,
//   WarningOutlined,
//   CheckCircleOutlined,
//   ExclamationCircleOutlined,
// } from '@ant-design/icons';
// import {
//   Button,
//   Card,
//   Col,
//   Input,
//   message,
//   Row,
//   Select,
//   Upload,
//   InputNumber,
//   Switch,
//   Space,
//   Typography,
//   Form,
//   Table,
//   Modal,
//   Tag,
//   Image,
//   Badge,
//   Spin,
//   Popconfirm,
//   Alert,
//   Statistic,
//   Tooltip,
// } from 'antd';
// import { useLocation, useNavigate } from 'react-router-dom';
// import axiosInstance from '@/services/axiosInstance';
// import { ActiveTabContext } from './ActiveTabContext';
// import TabHeader from './TabHeader';
// import { useCallback } from 'react';

// const { TextArea } = Input;
// const { Option } = Select;
// const { Title, Text } = Typography;

// const DEFAULT_IMAGE_PATH = '/placeholder.svg?height=400&width=400';

// const emptyProduct = {
//   name: '',
//   summary: '',
//   description: '',
//   brand: '',
//   category: '',
//   sku: '',
//   tags: [],
//   status: true,
//   price: {
//     regular: 0,
//     discountPercent: 0,
//     isOnSale: false,
//   },
//   stock: 0,
//   sales: 0,
//   variants: {
//     sizes: [],
//     colors: [],
//   },
//   inventory: [],
//   mainImage: '',
//   images: [],
//   rating: 0,
//   isNew: false,
// };

// const brandOptions = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans'];
// const sizeOptions = Array.from({ length: 21 }, (_, i) => 30 + i); // 30-50
// const colorOptions = [
//   { label: 'Black', value: 'Black', hex: '#000000' },
//   { label: 'White', value: 'White', hex: '#FFFFFF' },
//   { label: 'Red', value: 'Red', hex: '#FF0000' },
//   { label: 'Blue', value: 'Blue', hex: '#0000FF' },
//   { label: 'Green', value: 'Green', hex: '#008000' },
//   { label: 'Yellow', value: 'Yellow', hex: '#FFFF00' },
//   { label: 'Gray', value: 'Gray', hex: '#808080' },
//   { label: 'Brown', value: 'Brown', hex: '#A52A2A' },
//   { label: 'Navy', value: 'Navy', hex: '#000080' },
//   { label: 'Pink', value: 'Pink', hex: '#FFC0CB' },
// ];

// const STOCK_THRESHOLDS = {
//   OUT_OF_STOCK: 0,
//   LOW_STOCK: 10,
//   MEDIUM_STOCK: 50,
//   ITEM_LOW_STOCK: 5,
// };

// export default function ProductDetails() {
//   const { setActiveTab } = useContext(ActiveTabContext);
//   const location = useLocation();
//   const navigate = useNavigate();

//   // Cập nhật logic để detect đúng route
//   const isAddNew = location.pathname.includes('add-new');
//   const isEdit = location.pathname.includes('/edit');

//   // Lấy productId từ URL nếu là edit mode
//   const productId = isEdit ? location.pathname.split('/').slice(-2)[0] : null;

//   const [product, setProduct] = useState(emptyProduct);
//   const [originalProduct, setOriginalProduct] = useState(null); // Store original data
//   const [categories, setCategories] = useState([]);
//   const [fileList, setFileList] = useState([]);
//   const [inventoryImageFileList, setInventoryImageFileList] = useState([]);
//   const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
//   const [editingInventoryItem, setEditingInventoryItem] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [pageLoading, setPageLoading] = useState(true);
//   const [inventoryForm] = Form.useForm();

//   const uploadToCloud = useCallback(async ({ file, onSuccess, onError, onProgress }) => {
//     const formData = new FormData();
//     formData.append('image', file);
//     try {
//       const res = await axiosInstance.post('/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//         onUploadProgress: e => {
//           onProgress({ percent: (e.loaded / e.total) * 100 }, file);
//         },
//       });
//       const url = res.data.url;
//       onSuccess(res.data, file);
//       return url;
//     } catch (err) {
//       console.error('Upload error:', err);
//       onError(err);
//     }
//   }, []);

//   const getAuthHeaders = () => {
//     const userInfo = localStorage.getItem('userInfo');
//     const token = userInfo ? JSON.parse(userInfo).token : null;
//     return {
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       'Cache-Control': 'no-cache',
//       Pragma: 'no-cache',
//       Expires: '0',
//     };
//   };

//   useEffect(() => {
//     setActiveTab('2');
//     fetchInitialData();
//   }, [setActiveTab, isAddNew, location.pathname]);

//   const fetchInitialData = async () => {
//     setPageLoading(true);
//     try {
//       await fetchCategories();
//       if (!isAddNew && productId) {
//         await fetchProductDetails(productId);
//       }
//     } catch (error) {
//       console.error('Error fetching initial data:', error);
//     } finally {
//       setPageLoading(false);
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       const response = await axiosInstance.get('/categories?t=' + Date.now(), {
//         headers: getAuthHeaders(),
//       });
//       if (response.data && response.data.data) {
//         setCategories(response.data.data);
//       }
//     } catch (error) {
//       console.error('Error fetching categories:', error);
//       message.error('Failed to fetch categories!');
//     }
//   };

//   const fetchProductDetails = async productId => {
//     try {
//       const response = await axiosInstance.get('/products/' + productId + '?t=' + Date.now(), {
//         headers: getAuthHeaders(),
//       });

//       if (response.data && response.data.data) {
//         const productData = response.data.data;

//         // Store original data for comparison
//         setOriginalProduct(productData);

//         const calculatedStock = calculateTotalStock(productData.inventory || []);

//         // Preserve ALL original data - don't override with defaults
//         const processedProduct = {
//           ...productData,
//           stock: calculatedStock,
//           // Only set defaults if fields are actually missing/null
//           images: productData.images && productData.images.length > 0 ? productData.images : [],
//           mainImage: productData.mainImage || '',
//           variants: productData.variants || { sizes: [], colors: [] },
//           price: productData.price || { regular: 0, discountPercent: 0, isOnSale: false },
//         };

//         setProduct(processedProduct);

//         // Set up file list for images
//         if (productData.images && productData.images.length > 0) {
//           setFileList(
//             productData.images.map((img, idx) => ({
//               uid: String(idx),
//               name: `Product image ${idx + 1}.png`,
//               status: 'done',
//               url: img,
//             }))
//           );
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching product details:', error);
//       message.error('Failed to fetch product details!');
//     }
//   };

//   const handleChange = (field, value) => {
//     setProduct(prev => ({ ...prev, [field]: value }));
//   };

//   const handleNestedChange = (parentField, childField, value) => {
//     setProduct(prev => ({
//       ...prev,
//       [parentField]: {
//         ...prev[parentField],
//         [childField]: value,
//       },
//     }));
//   };

//   const calculateTotalStock = inventory => {
//     return inventory.reduce((total, item) => total + (item.quantity || 0), 0);
//   };

//   const calculateLowStockItems = inventory => {
//     return inventory.filter(
//       item => item.quantity > 0 && item.quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK
//     );
//   };

//   const calculateOutOfStockItems = inventory => {
//     return inventory.filter(item => item.quantity === 0);
//   };

//   const calculateAvailableItems = inventory => {
//     return inventory.filter(item => item.quantity > STOCK_THRESHOLDS.ITEM_LOW_STOCK);
//   };

//   // Auto-update variants based on inventory - this addresses your requirement
//   const updateVariantsFromInventory = inventory => {
//     const uniqueSizes = [...new Set(inventory.map(item => item.size))].sort((a, b) => a - b);
//     const uniqueColors = [...new Set(inventory.map(item => item.color))];
//     return {
//       sizes: uniqueSizes,
//       colors: uniqueColors,
//     };
//   };

//   // Update stock and variants whenever inventory changes
//   useEffect(() => {
//     const newStock = calculateTotalStock(product.inventory);
//     const newVariants = updateVariantsFromInventory(product.inventory);

//     setProduct(prev => ({
//       ...prev,
//       stock: newStock,
//       variants: newVariants, // Auto-update variants from inventory
//     }));
//   }, [product.inventory]);

//   const calculateSalePrice = () => {
//     if (product.price.regular && product.price.discountPercent) {
//       return product.price.regular * (1 - product.price.discountPercent / 100);
//     }
//     return product.price.regular;
//   };

//   // Improved file upload handling for multiple images
//   const handleUploadChange = ({ fileList: newFileList }) => {
//     setFileList(newFileList);

//     // Process all uploaded files
//     const processedImages = [];
//     let mainImageSet = false;

//     newFileList.forEach(file => {
//       let imageUrl = null;

//       if (file.url) {
//         imageUrl = file.url;
//       } else if (file.thumbUrl) {
//         imageUrl = file.thumbUrl;
//       } else if (file.originFileObj) {
//         // Create object URL for new uploads
//         imageUrl = URL.createObjectURL(file.originFileObj);
//       }

//       if (imageUrl) {
//         processedImages.push(imageUrl);
//         // Set first image as main image
//         if (!mainImageSet) {
//           setProduct(prev => ({ ...prev, mainImage: imageUrl }));
//           mainImageSet = true;
//         }
//       }
//     });

//     setProduct(prev => ({
//       ...prev,
//       images: processedImages,
//       // If no images, clear mainImage
//       mainImage: processedImages.length > 0 ? prev.mainImage || processedImages[0] : '',
//     }));
//   };

//   const handleInventoryImageUpload = ({ fileList: newFileList }) => {
//     setInventoryImageFileList(newFileList);
//   };

//   const openInventoryModal = item => {
//     setEditingInventoryItem(item || null);
//     if (item) {
//       inventoryForm.setFieldsValue(item);
//       if (item.images && item.images.length > 0) {
//         setInventoryImageFileList(
//           item.images.map((img, idx) => ({
//             uid: String(idx),
//             name: `Inventory image ${idx + 1}`,
//             status: 'done',
//             url: img,
//           }))
//         );
//       } else {
//         setInventoryImageFileList([]);
//       }
//     } else {
//       inventoryForm.resetFields();
//       setInventoryImageFileList([]);
//     }
//     setInventoryModalVisible(true);
//   };

//   const handleInventorySubmit = async () => {
//     try {
//       const values = await inventoryForm.validateFields();

//       // Process uploaded images for inventory item
//       const processedImages = inventoryImageFileList
//         .map(file => {
//           if (file.url) return file.url;
//           if (file.thumbUrl) return file.thumbUrl;
//           if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
//           return null;
//         })
//         .filter(Boolean);

//       const newItem = {
//         size: values.size,
//         color: values.color,
//         quantity: values.quantity,
//         isAvailable: values.quantity > 0,
//         images: processedImages,
//       };

//       let updatedInventory;
//       if (editingInventoryItem) {
//         updatedInventory = product.inventory.map(item =>
//           item.size === editingInventoryItem.size && item.color === editingInventoryItem.color
//             ? newItem
//             : item
//         );
//       } else {
//         const existingItem = product.inventory.find(
//           item => item.size === values.size && item.color === values.color
//         );
//         if (existingItem) {
//           message.error('This size and color combination already exists!');
//           return;
//         }
//         updatedInventory = [...product.inventory, newItem];
//       }

//       // Update inventory - variants will be auto-updated by useEffect
//       setProduct(prev => ({
//         ...prev,
//         inventory: updatedInventory,
//       }));

//       setInventoryModalVisible(false);
//       setEditingInventoryItem(null);
//       setInventoryImageFileList([]);
//       inventoryForm.resetFields();
//       message.success(
//         editingInventoryItem
//           ? 'Inventory item updated! Variants auto-updated.'
//           : 'Inventory item added! Variants auto-updated.'
//       );
//     } catch (error) {
//       console.error('Validation failed:', error);
//     }
//   };

//   const deleteInventoryItem = (size, color) => {
//     const updatedInventory = product.inventory.filter(
//       item => !(item.size === size && item.color === color)
//     );

//     setProduct(prev => ({
//       ...prev,
//       inventory: updatedInventory,
//     }));
//     message.success('Inventory item deleted! Variants auto-updated.');
//   };

//   const getStockStatus = () => {
//     const stock = product.stock;
//     if (stock === STOCK_THRESHOLDS.OUT_OF_STOCK) {
//       return {
//         status: 'error',
//         text: 'Out of Stock',
//         color: '#ff4d4f',
//         icon: <ExclamationCircleOutlined />,
//       };
//     }
//     if (stock <= STOCK_THRESHOLDS.LOW_STOCK) {
//       return { status: 'warning', text: 'Low Stock', color: '#faad14', icon: <WarningOutlined /> };
//     }
//     if (stock <= STOCK_THRESHOLDS.MEDIUM_STOCK) {
//       return { status: 'normal', text: 'In Stock', color: '#1890ff', icon: <InfoCircleOutlined /> };
//     }
//     return {
//       status: 'success',
//       text: 'Well Stocked',
//       color: '#52c41a',
//       icon: <CheckCircleOutlined />,
//     };
//   };

//   // Improved API functions with better error handling and data preservation
//   const handleCreate = async () => {
//     setLoading(true);
//     try {
//       const userInfo = localStorage.getItem('userInfo');
//       const token = userInfo ? JSON.parse(userInfo).token : null;

//       // Validate required fields
//       if (!product.name || !product.category || !product.brand) {
//         message.error('Please fill in all required fields to add product');
//         setLoading(false);
//         return;
//       }

//       const payload = {
//         name: product.name,
//         summary: product.summary,
//         description: product.description,
//         brand: product.brand,
//         category: product.category,
//         price: {
//           regular: Number(product.price.regular) || 0,
//           discountPercent: Number(product.price.discountPercent) || 0,
//           isOnSale: Boolean(product.price.isOnSale),
//         },
//         variants: {
//           sizes: product.variants.sizes || [],
//           colors: product.variants.colors || [],
//         },
//         inventory: product.inventory || [],
//         images: product.images || [],
//         mainImage: product.mainImage || '',
//         tags: product.tags || [],
//         status: product.status,
//         stock: product.stock || 0,
//         isNew: product.isNew,
//       };

//       console.log('Creating product with payload:', payload); // Debug log

//       const response = await axiosInstance.post('/products/add', payload);

//       message.success('Product created successfully!');
//       // Redirect to shop products page
//       window.location.href = '/shop/products';
//       setTimeout(() => {
//         window.location.href = '/shop/products';
//       }, 1000);
//     } catch (err) {
//       console.error('Create product error:', err);
//       message.error(`Failed to create product: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdate = async () => {
//     setLoading(true);
//     try {
//       const userInfo = localStorage.getItem('userInfo');
//       const token = userInfo ? JSON.parse(userInfo).token : null;
//       const productId = product._id || product.id;

//       // Validate required fields
//       if (!product.name || !product.category || !product.brand) {
//         message.error('Please fill in all required fields to add product');
//         setLoading(false);
//         return;
//       }

//       // Preserve all original data and only update changed fields
//       const payload = {
//         ...originalProduct, // Start with original data
//         // Override with current form data
//         name: product.name,
//         summary: product.summary,
//         description: product.description,
//         brand: product.brand,
//         category: product.category,
//         price: {
//           regular: Number(product.price.regular) || 0,
//           discountPercent: Number(product.price.discountPercent) || 0,
//           isOnSale: Boolean(product.price.isOnSale),
//         },
//         variants: {
//           sizes: product.variants.sizes || [],
//           colors: product.variants.colors || [],
//         },
//         inventory: product.inventory || [],
//         images: product.images || [],
//         mainImage: product.mainImage || '',
//         tags: product.tags || [],
//         status: product.status,
//         stock: product.stock || 0,
//         isNew: product.isNew,
//       };

//       console.log('Updating product with payload:', payload); // Debug log

//       const response = await axiosInstance.put('/products/' + productId, payload, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : '',
//           'Content-Type': 'application/json',
//         },
//       });

//       message.success('Product updated successfully!');
//       // Redirect to shop products page
//       window.location.href = '/shop/products';
//       // Refresh the product data to show updated info
//       setTimeout(async () => {
//         await fetchProductDetails(productId);
//       }, 500);
//     } catch (err) {
//       console.error('Update product error:', err);
//       message.error(`Failed to update product: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async () => {
//     setLoading(true);
//     try {
//       const userInfo = localStorage.getItem('userInfo');
//       const token = userInfo ? JSON.parse(userInfo).token : null;
//       const productId = product._id || product.id;

//       await axiosInstance.delete('/products/' + productId + '/delete', {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : '',
//         },
//       });
//       message.success('Product deleted successfully!');
//       // Redirect to shop products page
//       window.location.href = '/shop/products';
//       setTimeout(() => {
//         window.location.href = '/shop/products';
//       }, 1000);
//     } catch (err) {
//       console.error('Delete product error:', err);
//       message.error(`Failed to delete product: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     message.info('Changes canceled');
//     // Redirect to shop products page
//     window.location.href = '/shop/products';
//   };

//   // Inventory table columns
//   const inventoryColumns = [
//     {
//       title: 'Size',
//       dataIndex: 'size',
//       key: 'size',
//       render: size => (
//         <Tag color="blue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
//           {size}
//         </Tag>
//       ),
//     },
//     {
//       title: 'Color',
//       dataIndex: 'color',
//       key: 'color',
//       render: color => {
//         const colorOption = colorOptions.find(opt => opt.value === color);
//         return (
//           <Space>
//             <div
//               style={{
//                 width: 20,
//                 height: 20,
//                 backgroundColor: colorOption?.hex || '#ccc',
//                 border: '2px solid #d9d9d9',
//                 borderRadius: 4,
//               }}
//             />
//             <Text strong>{color}</Text>
//           </Space>
//         );
//       },
//     },
//     {
//       title: 'Quantity',
//       dataIndex: 'quantity',
//       key: 'quantity',
//       render: quantity => (
//         <div style={{ textAlign: 'center' }}>
//           <Badge
//             count={quantity}
//             style={{
//               backgroundColor:
//                 quantity > STOCK_THRESHOLDS.ITEM_LOW_STOCK
//                   ? '#52c41a'
//                   : quantity > 0
//                     ? '#faad14'
//                     : '#ff4d4f',
//               fontSize: '14px',
//               fontWeight: 'bold',
//               minWidth: '40px',
//               height: '24px',
//               lineHeight: '24px',
//             }}
//           />
//         </div>
//       ),
//     },
//     {
//       title: 'Status',
//       dataIndex: 'isAvailable',
//       key: 'isAvailable',
//       render: (isAvailable, record) => {
//         const quantity = record.quantity;
//         if (quantity === 0) {
//           return (
//             <Tag color="red" icon={<ExclamationCircleOutlined />}>
//               Out of Stock
//             </Tag>
//           );
//         }
//         if (quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK) {
//           return (
//             <Tag color="orange" icon={<WarningOutlined />}>
//               Low Stock
//             </Tag>
//           );
//         }
//         return (
//           <Tag color="green" icon={<CheckCircleOutlined />}>
//             In Stock
//           </Tag>
//         );
//       },
//     },
//     {
//       title: 'SKU',
//       dataIndex: 'sku',
//       key: 'sku',
//       render: sku => <Text type="secondary">{sku || 'Auto-generated'}</Text>,
//     },
//     {
//       title: 'Images',
//       dataIndex: 'images',
//       key: 'images',
//       render: images => (
//         <Space>
//           {images &&
//             images
//               .slice(0, 2)
//               .map((img, idx) => (
//                 <Image
//                   key={idx}
//                   width={35}
//                   height={35}
//                   src={img || '/placeholder.svg'}
//                   style={{ borderRadius: 6, border: '1px solid #d9d9d9' }}
//                   fallback="/placeholder.svg?height=35&width=35"
//                 />
//               ))}
//           {images && images.length > 2 && <Tag color="blue">+{images.length - 2}</Tag>}
//         </Space>
//       ),
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space>
//           <Button
//             type="link"
//             icon={<EditOutlined />}
//             onClick={() => openInventoryModal(record)}
//             style={{ color: '#1890ff' }}
//           />
//           <Popconfirm
//             title="Delete inventory item"
//             description="Are you sure you want to delete this inventory item?"
//             onConfirm={() => deleteInventoryItem(record.size, record.color)}
//             okText="Yes"
//             cancelText="No"
//           >
//             <Button type="link" danger icon={<DeleteOutlined />} />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   const stockStatus = getStockStatus();
//   const lowStockItems = calculateLowStockItems(product.inventory);
//   const outOfStockItems = calculateOutOfStockItems(product.inventory);
//   const availableItems = calculateAvailableItems(product.inventory);

//   if (pageLoading) {
//     return (
//       <div
//         style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}
//       >
//         <Spin size="large" />
//       </div>
//     );
//   }

//   return (
//     <div>
//       <TabHeader
//         breadcrumb="All Products"
//         anotherBreadcrumb={isAddNew ? 'Add New Product' : 'Edit Product'}
//       />

//       <div className="product-details-container" style={{ padding: '24px', background: '#f5f5f5' }}>
//         {/* Stock Status Alerts */}
//         {product.stock <= STOCK_THRESHOLDS.LOW_STOCK && (
//           <Alert
//             message={
//               <Space>
//                 {stockStatus.icon}
//                 <span>
//                   <strong>{stockStatus.text}:</strong> Only {product.stock} items remaining
//                   {lowStockItems.length > 0 && ` (${lowStockItems.length} items low stock)`}
//                   {outOfStockItems.length > 0 && ` (${outOfStockItems.length} items out of stock)`}
//                 </span>
//               </Space>
//             }
//             type={stockStatus.status}
//             showIcon={false}
//             style={{ marginBottom: 24, borderRadius: 8 }}
//             action={
//               <Space>
//                 <Button size="small" type="primary" onClick={() => openInventoryModal()}>
//                   Add Stock
//                 </Button>
//                 <Tooltip title="View low stock items">
//                   <Button size="small" type="default" icon={<WarningOutlined />}>
//                     {lowStockItems.length} Low
//                   </Button>
//                 </Tooltip>
//               </Space>
//             }
//           />
//         )}

//         <Row gutter={[24, 24]}>
//           {/* Main Content */}
//           <Col xs={24} lg={16}>
//             {/* Basic Information */}
//             <Card
//               title={
//                 <Space>
//                   <InfoCircleOutlined />
//                   <span>Basic Information</span>
//                 </Space>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 marginBottom: 24,
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     <span style={{ color: 'red' }}>*</span> Product Name
//                   </label>
//                   <Input
//                     size="large"
//                     placeholder="Enter product name"
//                     value={product.name}
//                     onChange={e => handleChange('name', e.target.value)}
//                   />
//                 </Col>

//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     <span style={{ color: 'red' }}>*</span> Product Summary
//                   </label>
//                   <Input
//                     size="large"
//                     placeholder="Brief product summary"
//                     value={product.summary}
//                     onChange={e => handleChange('summary', e.target.value)}
//                   />
//                 </Col>

//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     <span style={{ color: 'red' }}>*</span> Product Description
//                   </label>
//                   <TextArea
//                     placeholder="Detailed product description"
//                     value={product.description}
//                     onChange={e => handleChange('description', e.target.value)}
//                     rows={4}
//                     style={{ resize: 'none' }}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     <span style={{ color: 'red' }}>*</span> Category
//                   </label>
//                   <Select
//                     size="large"
//                     placeholder="Select a category"
//                     value={product.category}
//                     onChange={value => handleChange('category', value)}
//                     style={{ width: '100%' }}
//                     showSearch
//                     optionFilterProp="children"
//                     filterOption={(input, option) =>
//                       option.children.toLowerCase().includes(input.toLowerCase())
//                     }
//                   >
//                     {categories.map(cat => (
//                       <Option key={cat._id} value={cat._id}>
//                         {cat.name}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     <span style={{ color: 'red' }}>*</span> Brand
//                   </label>
//                   <Select
//                     size="large"
//                     placeholder="Select a brand"
//                     value={product.brand}
//                     onChange={value => handleChange('brand', value)}
//                     style={{ width: '100%' }}
//                     showSearch
//                     optionFilterProp="children"
//                     filterOption={(input, option) =>
//                       option.children.toLowerCase().includes(input.toLowerCase())
//                     }
//                   >
//                     {brandOptions.map(brand => (
//                       <Option key={brand} value={brand}>
//                         {brand}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     Total Stock Quantity (Auto-calculated)
//                   </label>
//                   <div
//                     style={{
//                       padding: '12px 16px',
//                       background: stockStatus.color + '15',
//                       border: `2px solid ${stockStatus.color}`,
//                       borderRadius: '8px',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'space-between',
//                     }}
//                   >
//                     <div>
//                       <Text strong style={{ fontSize: '18px', color: stockStatus.color }}>
//                         {product.stock} units
//                       </Text>
//                       <br />
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {stockStatus.text}
//                       </Text>
//                     </div>
//                     <div style={{ textAlign: 'right' }}>
//                       <div style={{ color: stockStatus.color, fontSize: '20px' }}>
//                         {stockStatus.icon}
//                       </div>
//                     </div>
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Pricing */}
//             <Card
//               title={
//                 <Space>
//                   <DollarOutlined />
//                   <span>Pricing & Sales</span>
//                 </Space>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 marginBottom: 24,
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     <span style={{ color: 'red' }}>*</span> Regular Price * ($)
//                   </label>
//                   <InputNumber
//                     size="large"
//                     placeholder="0.00"
//                     min={0}
//                     step={0.01}
//                     value={product.price.regular}
//                     onChange={value => handleNestedChange('price', 'regular', value || 0)}
//                     style={{ width: '100%' }}
//                     formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                     parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     Discount Percentage (%)
//                   </label>
//                   <InputNumber
//                     size="large"
//                     placeholder="0"
//                     min={0}
//                     max={100}
//                     value={product.price.discountPercent}
//                     onChange={value => handleNestedChange('price', 'discountPercent', value || 0)}
//                     style={{ width: '100%' }}
//                     formatter={value => `${value}%`}
//                     parser={value => value.replace('%', '')}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Space direction="vertical" style={{ width: '100%' }}>
//                     <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                       On Sale
//                     </label>
//                     <Switch
//                       checked={product.price.isOnSale}
//                       onChange={checked => handleNestedChange('price', 'isOnSale', checked)}
//                       checkedChildren="Yes"
//                       unCheckedChildren="No"
//                     />
//                   </Space>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     Sale Price ($)
//                   </label>
//                   <div
//                     style={{
//                       padding: '8px 12px',
//                       background: '#f0f0f0',
//                       borderRadius: '6px',
//                       fontSize: '16px',
//                       fontWeight: 600,
//                       color: '#52c41a',
//                     }}
//                   >
//                     {formatPrice(calculateSalePrice())}
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Product Variants - Now Auto-Generated */}
//             <Card
//               title={
//                 <Space>
//                   <TagsOutlined />
//                   <span>Product Variants (Auto-Generated from Inventory)</span>
//                 </Space>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 marginBottom: 24,
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     Available Sizes (Auto-generated from Inventory)
//                   </label>
//                   <div
//                     style={{
//                       padding: '12px 16px',
//                       background: '#f5f5f5',
//                       borderRadius: '8px',
//                       border: '2px dashed #d9d9d9',
//                       minHeight: '40px',
//                       display: 'flex',
//                       alignItems: 'center',
//                       flexWrap: 'wrap',
//                       gap: '8px',
//                     }}
//                   >
//                     {product.variants.sizes.length > 0 ? (
//                       product.variants.sizes.map(size => (
//                         <Tag
//                           key={size}
//                           color="blue"
//                           style={{ fontSize: '12px', fontWeight: 'bold' }}
//                         >
//                           Size {size}
//                         </Tag>
//                       ))
//                     ) : (
//                       <Text type="secondary" style={{ fontStyle: 'italic' }}>
//                         No sizes available. Add inventory items to populate sizes automatically.
//                       </Text>
//                     )}
//                   </div>
//                 </Col>

//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     Available Colors (Auto-generated from Inventory)
//                   </label>
//                   <div
//                     style={{
//                       padding: '12px 16px',
//                       background: '#f5f5f5',
//                       borderRadius: '8px',
//                       border: '2px dashed #d9d9d9',
//                       minHeight: '40px',
//                       display: 'flex',
//                       alignItems: 'center',
//                       flexWrap: 'wrap',
//                       gap: '8px',
//                     }}
//                   >
//                     {product.variants.colors.length > 0 ? (
//                       product.variants.colors.map(color => {
//                         const colorOption = colorOptions.find(opt => opt.value === color);
//                         return (
//                           <Tag
//                             key={color}
//                             style={{
//                               display: 'flex',
//                               alignItems: 'center',
//                               gap: '6px',
//                               padding: '4px 8px',
//                               fontSize: '12px',
//                               fontWeight: 'bold',
//                             }}
//                           >
//                             <div
//                               style={{
//                                 width: 14,
//                                 height: 14,
//                                 backgroundColor: colorOption?.hex || '#ccc',
//                                 border: '1px solid #d9d9d9',
//                                 borderRadius: 2,
//                               }}
//                             />
//                             {color}
//                           </Tag>
//                         );
//                       })
//                     ) : (
//                       <Text type="secondary" style={{ fontStyle: 'italic' }}>
//                         No colors available. Add inventory items to populate colors automatically.
//                       </Text>
//                     )}
//                   </div>
//                 </Col>

//                 <Col span={24}>
//                   <Alert
//                     message="Variants Auto-Update"
//                     description="Available sizes and colors are automatically generated based on your inventory items. Add inventory items to see variants appear here."
//                     type="info"
//                     showIcon
//                     style={{ marginTop: 16 }}
//                   />
//                 </Col>
//               </Row>
//             </Card>

//             {/* Inventory Management */}
//             <Card
//               title={
//                 <Space>
//                   <ShoppingOutlined />
//                   <span>Inventory Management</span>
//                   <Badge count={product.inventory.length} style={{ backgroundColor: '#1890ff' }} />
//                   {lowStockItems.length > 0 && (
//                     <Badge count={lowStockItems.length} style={{ backgroundColor: '#faad14' }} />
//                   )}
//                 </Space>
//               }
//               extra={
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   onClick={() => openInventoryModal()}
//                   size="large"
//                 >
//                   Add Inventory Item
//                 </Button>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 marginBottom: 24,
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//               }}
//             >
//               {/* Stock Overview */}
//               <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
//                 <Col xs={24} sm={6}>
//                   <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
//                     <Statistic
//                       title="Total Stock"
//                       value={product.stock}
//                       valueStyle={{ color: '#1890ff', fontSize: '24px' }}
//                       suffix="units"
//                     />
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                   <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
//                     <Statistic
//                       title="Well Stocked"
//                       value={availableItems.length}
//                       valueStyle={{ color: '#52c41a', fontSize: '24px' }}
//                       suffix="items"
//                     />
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                   <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
//                     <Statistic
//                       title="Low Stock"
//                       value={lowStockItems.length}
//                       valueStyle={{ color: '#faad14', fontSize: '24px' }}
//                       suffix="items"
//                       prefix={<WarningOutlined />}
//                     />
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={6}>
//                   <Card size="small" style={{ textAlign: 'center', background: '#fff2f0' }}>
//                     <Statistic
//                       title="Out of Stock"
//                       value={outOfStockItems.length}
//                       valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
//                       suffix="items"
//                       prefix={<ExclamationCircleOutlined />}
//                     />
//                   </Card>
//                 </Col>
//               </Row>

//               <Table
//                 columns={inventoryColumns}
//                 dataSource={product.inventory}
//                 rowKey={record => `${record.size}-${record.color}`}
//                 pagination={false}
//                 scroll={{ x: 800 }}
//                 locale={{
//                   emptyText:
//                     "No inventory items added yet. Click 'Add Inventory Item' to get started.",
//                 }}
//                 size="middle"
//                 rowClassName={record => {
//                   if (record.quantity === 0) return 'out-of-stock-row';
//                   if (record.quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK) return 'low-stock-row';
//                   return '';
//                 }}
//               />
//             </Card>

//             {/* Additional Information */}
//             <Card
//               title={
//                 <Space>
//                   <TagsOutlined />
//                   <span>Additional Information</span>
//                 </Space>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 marginBottom: 24,
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                     Product Tags
//                   </label>
//                   <Select
//                     mode="tags"
//                     size="large"
//                     placeholder="Add tags (press Enter to add)"
//                     value={product.tags}
//                     onChange={tags => handleChange('tags', tags)}
//                     style={{ width: '100%' }}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Space direction="vertical" style={{ width: '100%' }}>
//                     <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                       Product Status
//                     </label>
//                     <Switch
//                       checked={product.status}
//                       onChange={checked => handleChange('status', checked)}
//                       checkedChildren="Active"
//                       unCheckedChildren="Inactive"
//                     />
//                   </Space>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Space direction="vertical" style={{ width: '100%' }}>
//                     <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
//                       New Product
//                     </label>
//                     <Switch
//                       checked={product.isNew}
//                       onChange={checked => handleChange('isNew', checked)}
//                       checkedChildren="Yes"
//                       unCheckedChildren="No"
//                     />
//                   </Space>
//                 </Col>
//               </Row>
//             </Card>
//           </Col>

//           {/* Sidebar */}
//           <Col xs={24} lg={8}>
//             <Card
//               title={
//                 <Space>
//                   <PictureOutlined />
//                   <span>Product Gallery</span>
//                   <Badge count={fileList.length} style={{ backgroundColor: '#1890ff' }} />
//                 </Space>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//               }}
//             >
//               {product.mainImage && (
//                 <div style={{ marginBottom: 16 }}>
//                   <img
//                     style={{
//                       width: '100%',
//                       borderRadius: '12px',
//                       maxHeight: '200px',
//                       objectFit: 'cover',
//                     }}
//                     src={product.mainImage || '/placeholder.svg'}
//                     alt="Main Product Image"
//                   />
//                   <Text
//                     type="secondary"
//                     style={{
//                       fontSize: '12px',
//                       display: 'block',
//                       textAlign: 'center',
//                       marginTop: 4,
//                     }}
//                   >
//                     Main Image
//                   </Text>
//                 </div>
//               )}

//               <Upload.Dragger
//                 fileList={fileList}
//                 customRequest={async options => {
//                   const url = await uploadToCloud(options);
//                   if (url) {
//                     // cập nhật state
//                     setFileList(prev => [
//                       ...prev,
//                       { uid: options.file.uid, name: options.file.name, status: 'done', url },
//                     ]);
//                     setProduct(prev => ({
//                       ...prev,
//                       mainImage: url,
//                       images: [...prev.images, url],
//                     }));
//                   }
//                 }}
//                 onRemove={file => {
//                   setFileList(prev => prev.filter(f => f.uid !== file.uid));
//                   setProduct(prev => ({
//                     ...prev,
//                     images: prev.images.filter(img => img !== file.url),
//                     mainImage:
//                       prev.mainImage === file.url
//                         ? prev.images.filter(img => img !== file.url)[0] || ''
//                         : prev.mainImage,
//                   }));
//                 }}
//                 listType="picture"
//                 accept=".png,.jpg,.jpeg,.webp"
//                 multiple
//                 style={{
//                   borderRadius: 8,
//                   border: '2px dashed #d9d9d9',
//                   background: '#fafafa',
//                 }}
//               >
//                 <p className="ant-upload-drag-icon">
//                   <PlusOutlined style={{ fontSize: 24, color: '#1890ff' }} />
//                 </p>
//                 <p className="ant-upload-text" style={{ fontSize: 16, margin: '8px 0' }}>
//                   <strong>Drop multiple images here</strong> or click to browse
//                 </p>
//                 <p className="ant-upload-hint" style={{ color: '#999', fontSize: 14 }}>
//                   Support: JPG, PNG, WEBP (Max 5MB each). First image becomes main image.
//                 </p>
//               </Upload.Dragger>
//             </Card>
//           </Col>
//         </Row>

//         {/* Action Buttons */}
//         <Card
//           bordered={false}
//           style={{
//             borderRadius: 12,
//             marginTop: 24,
//             textAlign: 'center',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//           }}
//         >
//           <Space size="large">
//             {isAddNew ? (
//               <Button
//                 type="primary"
//                 size="large"
//                 onClick={handleCreate}
//                 loading={loading}
//                 style={{ minWidth: 120, height: 48 }}
//               >
//                 Create Product
//               </Button>
//             ) : (
//               <>
//                 <Button
//                   type="primary"
//                   size="large"
//                   onClick={handleUpdate}
//                   loading={loading}
//                   style={{ minWidth: 120, height: 48 }}
//                 >
//                   Update Product
//                 </Button>
//                 <Button
//                   danger
//                   size="large"
//                   icon={<DeleteOutlined />}
//                   onClick={handleDelete}
//                   loading={loading}
//                   style={{ minWidth: 120, height: 48 }}
//                 >
//                   Delete
//                 </Button>
//               </>
//             )}
//             <Button size="large" onClick={handleCancel} style={{ minWidth: 120, height: 48 }}>
//               Cancel
//             </Button>
//           </Space>
//         </Card>

//         {/* Inventory Modal */}
//         <Modal
//           title={
//             <Space>
//               <ShoppingOutlined />
//               {editingInventoryItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
//             </Space>
//           }
//           open={inventoryModalVisible}
//           onOk={handleInventorySubmit}
//           onCancel={() => {
//             setInventoryModalVisible(false);
//             setEditingInventoryItem(null);
//             setInventoryImageFileList([]);
//             inventoryForm.resetFields();
//           }}
//           width={600}
//           okText={editingInventoryItem ? 'Update Item' : 'Add Item'}
//         >
//           <Form form={inventoryForm} layout="vertical">
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="size"
//                   label="Size"
//                   rules={[{ required: true, message: 'Please select a size!' }]}
//                 >
//                   <Select placeholder="Select size" size="large">
//                     {sizeOptions.map(size => (
//                       <Option key={size} value={size}>
//                         Size {size}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item
//                   name="color"
//                   label="Color"
//                   rules={[{ required: true, message: 'Please select a color!' }]}
//                 >
//                   <Select placeholder="Select color" size="large">
//                     {colorOptions.map(color => (
//                       <Option key={color.value} value={color.value}>
//                         <Space>
//                           <div
//                             style={{
//                               width: 20,
//                               height: 20,
//                               backgroundColor: color.hex,
//                               border: '1px solid #d9d9d9',
//                               borderRadius: 4,
//                             }}
//                           />
//                           {color.label}
//                         </Space>
//                       </Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
//             </Row>
//             <Form.Item
//               name="quantity"
//               label="Quantity"
//               rules={[{ required: true, message: 'Please enter quantity!' }]}
//               extra={`This will be added to the total stock automatically. Low stock threshold: ≤${STOCK_THRESHOLDS.ITEM_LOW_STOCK} units`}
//             >
//               <InputNumber
//                 placeholder="Enter quantity"
//                 min={0}
//                 style={{ width: '100%' }}
//                 size="large"
//                 formatter={value => `${value} units`}
//                 parser={value => value.replace(' units', '')}
//               />
//             </Form.Item>
//             <Form.Item
//               name="images"
//               label="Images (Optional)"
//               extra="Upload multiple images for this specific inventory item"
//             >
//               <Upload.Dragger
//                 fileList={inventoryImageFileList}
//                 customRequest={async options => {
//                   const url = await uploadToCloud(options);
//                   if (url) {
//                     setInventoryImageFileList(prev => [
//                       ...prev,
//                       { uid: options.file.uid, name: options.file.name, status: 'done', url },
//                     ]);
//                     // cập nhật form field để submit lên backend
//                     const prevImgs = inventoryForm.getFieldValue('images') || [];
//                     inventoryForm.setFieldsValue({ images: [...prevImgs, url] });
//                   }
//                 }}
//                 onRemove={file => {
//                   setInventoryImageFileList(prev => prev.filter(f => f.uid !== file.uid));
//                   const prevImgs = inventoryForm.getFieldValue('images') || [];
//                   inventoryForm.setFieldsValue({
//                     images: prevImgs.filter(img => img !== file.url),
//                   });
//                 }}
//                 listType="picture"
//                 accept=".png,.jpg,.jpeg,.webp"
//                 multiple
//                 style={{
//                   borderRadius: 8,
//                   border: '2px dashed #d9d9d9',
//                   background: '#fafafa',
//                   padding: '20px',
//                 }}
//               >
//                 <p className="ant-upload-drag-icon">
//                   <PictureOutlined style={{ fontSize: 20, color: '#1890ff' }} />
//                 </p>
//                 <p className="ant-upload-text" style={{ fontSize: 14, margin: '8px 0' }}>
//                   <strong>Drop multiple images here</strong> or click to browse
//                 </p>
//                 <p className="ant-upload-hint" style={{ color: '#999', fontSize: 12 }}>
//                   Support: JPG, PNG, WEBP (Max 5MB each)
//                 </p>
//               </Upload.Dragger>
//             </Form.Item>
//           </Form>
//         </Modal>

//         {/* Custom CSS for row highlighting */}
//         <style jsx>{`
//           .low-stock-row {
//             background-color: #fff7e6 !important;
//           }
//           .out-of-stock-row {
//             background-color: #fff2f0 !important;
//           }
//         `}</style>
//       </div>
//     </div>
//   );
// }
'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { formatPrice } from '../../../utils/StringFormat';
import {
  DeleteOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  TagsOutlined,
  PictureOutlined,
  EditOutlined,
  ShoppingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Select,
  Upload,
  InputNumber,
  Switch,
  Space,
  Typography,
  Form,
  Table,
  Modal,
  Tag,
  Image,
  Badge,
  Spin,
  Popconfirm,
  Alert,
  Statistic,
  Tooltip,
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '@/services/axiosInstance';
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
  images: [],
  rating: 0,
  isNew: false,
};

const brandOptions = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans'];
const sizeOptions = Array.from({ length: 21 }, (_, i) => 30 + i);
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

// Validation rules and functions
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
    maxSize: 5 * 1024 * 1024, // 5MB
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

const validateProduct = product => {
  const errors = {};

  // Basic information validation
  const nameErrors = validateField('name', product.name);
  if (nameErrors.length > 0) errors.name = nameErrors;

  const summaryErrors = validateField('summary', product.summary);
  if (summaryErrors.length > 0) errors.summary = summaryErrors;

  const descriptionErrors = validateField('description', product.description);
  if (descriptionErrors.length > 0) errors.description = descriptionErrors;

  // Required fields
  if (!product.category) {
    errors.category = ['Category is required'];
  }
  if (!product.brand) {
    errors.brand = ['Brand is required'];
  }

  // Price validation
  const priceErrors = validateField('price', product.price?.regular);
  if (priceErrors.length > 0) errors.price = priceErrors;

  const discountErrors = validateField('discount', product.price?.discountPercent);
  if (discountErrors.length > 0) errors.discount = discountErrors;

  // Tags validation
  if (product.tags && product.tags.length > VALIDATION_RULES.tags.maxCount) {
    errors.tags = [`Maximum ${VALIDATION_RULES.tags.maxCount} tags allowed`];
  }

  // Check for duplicate tags
  if (product.tags && product.tags.length !== new Set(product.tags).size) {
    errors.tags = [...(errors.tags || []), 'Duplicate tags are not allowed'];
  }

  // Images validation
  if (!product.images || product.images.length === 0) {
    errors.images = ['At least one product image is required'];
  }

  // Inventory validation
  if (!product.inventory || product.inventory.length === 0) {
    errors.inventory = ['At least one inventory item is required'];
  }

  // Check for duplicate inventory combinations
  if (product.inventory && product.inventory.length > 0) {
    const combinations = product.inventory.map(item => `${item.size}-${item.color}`);
    if (combinations.length !== new Set(combinations).size) {
      errors.inventory = [
        ...(errors.inventory || []),
        'Duplicate size and color combinations found',
      ];
    }
  }

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

const updateVariantsFromInventory = inventory => {
  const sizes = [...new Set(inventory.map(item => item.size).filter(Boolean))];
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
  const [fileList, setFileList] = useState([]);
  const [inventoryImageFileList, setInventoryImageFileList] = useState([]);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [inventoryForm] = Form.useForm();

  const handleChange = (field, value) => {
    const updatedProduct = { ...product, [field]: value };
    setProduct(updatedProduct);

    // Clear validation error for this specific field if it's now valid
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

    // Clear validation error for price/discount fields
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
    // Validate file before upload
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
      return url;
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
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
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
          images: productData.images && productData.images.length > 0 ? productData.images : [],
          mainImage: productData.mainImage || '',
          variants: productData.variants || { sizes: [], colors: [] },
          price: productData.price || { regular: 0, discountPercent: 0, isOnSale: false },
          category:
            typeof productData.category === 'object' && productData.category !== null
              ? productData.category._id
              : productData.category,
        };

        setProduct(processedProduct);

        if (productData.images && productData.images.length > 0) {
          setFileList(
            productData.images.map((img, idx) => ({
              uid: String(idx),
              name: `Product image ${idx + 1}.png`,
              status: 'done',
              url: img,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      message.error('Failed to fetch product details!');
    }
  };

  useEffect(() => {
    const newStock = calculateTotalStock(product.inventory);
    const newVariants = updateVariantsFromInventory(product.inventory);
    const updatedProduct = {
      ...product,
      stock: newStock,
      variants: newVariants,
    };
    setProduct(updatedProduct);

    // Clear inventory validation error if inventory is now present
    if (validationErrors.inventory && product.inventory.length > 0) {
      const newErrors = { ...validationErrors };
      delete newErrors.inventory;
      setValidationErrors(newErrors);
    }
  }, [product.inventory, validationErrors]);

  const calculateSalePrice = () => {
    if (product.price.regular && product.price.discountPercent) {
      return product.price.regular * (1 - product.price.discountPercent / 100);
    }
    return product.price.regular;
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    // Validate file count
    if (newFileList.length > VALIDATION_RULES.images.maxCount) {
      message.error(`Maximum ${VALIDATION_RULES.images.maxCount} images allowed`);
      return;
    }

    setFileList(newFileList);

    const processedImages = [];
    let mainImageSet = false;

    newFileList.forEach(file => {
      let imageUrl = null;
      if (file.url) {
        imageUrl = file.url;
      } else if (file.thumbUrl) {
        imageUrl = file.thumbUrl;
      } else if (file.originFileObj) {
        imageUrl = URL.createObjectURL(file.originFileObj);
      }

      if (imageUrl) {
        processedImages.push(imageUrl);
        if (!mainImageSet) {
          setProduct(prev => ({ ...prev, mainImage: imageUrl }));
          mainImageSet = true;
        }
      }
    });

    const updatedProduct = {
      ...product,
      images: processedImages,
      mainImage: processedImages.length > 0 ? product.mainImage || processedImages[0] : '',
    };
    setProduct(updatedProduct);
    // Clear images validation error if images are now present
    if (validationErrors.images && processedImages.length > 0) {
      const newErrors = { ...validationErrors };
      delete newErrors.images;
      setValidationErrors(newErrors);
    }
  };

  const handleInventoryImageUpload = ({ fileList: newFileList }) => {
    setInventoryImageFileList(newFileList);
  };

  const openInventoryModal = item => {
    setEditingInventoryItem(item || null);
    if (item) {
      inventoryForm.setFieldsValue(item);
      if (item.images && item.images.length > 0) {
        setInventoryImageFileList(
          item.images.map((img, idx) => ({
            uid: String(idx),
            name: `Inventory image ${idx + 1}`,
            status: 'done',
            url: img,
          }))
        );
      } else {
        setInventoryImageFileList([]);
      }
    } else {
      inventoryForm.resetFields();
      setInventoryImageFileList([]);
    }
    setInventoryModalVisible(true);
  };

  const handleInventorySubmit = async () => {
    try {
      const values = await inventoryForm.validateFields();

      // Validate inventory item
      if (!values.size || !values.color || values.quantity === undefined) {
        message.error('Please fill in all required fields');
        return;
      }

      if (values.quantity < 0) {
        message.error('Quantity cannot be negative');
        return;
      }

      if (values.quantity > 10000) {
        message.error('Quantity cannot exceed 10,000');
        return;
      }

      const processedImages = inventoryImageFileList
        .map(file => {
          if (file.url) return file.url;
          if (file.thumbUrl) return file.thumbUrl;
          if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
          return null;
        })
        .filter(Boolean);

      const newItem = {
        size: values.size,
        color: values.color,
        quantity: values.quantity,
        isAvailable: values.quantity > 0,
        images: processedImages,
      };

      let updatedInventory;
      if (editingInventoryItem) {
        updatedInventory = product.inventory.map(item =>
          item.size === editingInventoryItem.size && item.color === editingInventoryItem.color
            ? newItem
            : item
        );
      } else {
        const existingItem = product.inventory.find(
          item => item.size === values.size && item.color === values.color
        );
        if (existingItem) {
          message.error('This size and color combination already exists!');
          return;
        }
        updatedInventory = [...product.inventory, newItem];
      }

      const updatedProduct = {
        ...product,
        inventory: updatedInventory,
      };
      setProduct(updatedProduct);

      setInventoryModalVisible(false);
      setEditingInventoryItem(null);
      setInventoryImageFileList([]);
      inventoryForm.resetFields();

      message.success(
        editingInventoryItem
          ? 'Inventory item updated! Variants auto-updated.'
          : 'Inventory item added! Variants auto-updated.'
      );
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Please check all required fields');
    }
  };

  const deleteInventoryItem = (size, color) => {
    const updatedInventory = product.inventory.filter(
      item => !(item.size === size && item.color === color)
    );
    const updatedProduct = {
      ...product,
      inventory: updatedInventory,
    };
    setProduct(updatedProduct);
    message.success('Inventory item deleted! Variants auto-updated.');
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
    // Clear previous validation errors
    setValidationErrors({});

    // Comprehensive validation before submit
    const errors = validateProduct(product);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      message.error('Please fix all validation errors before creating the product');

      // Scroll to first error
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
        images: product.images || [],
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
    // Clear previous validation errors
    setValidationErrors({});

    // Comprehensive validation before submit
    const errors = validateProduct(product);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      message.error('Please fix all validation errors before updating the product');

      // Scroll to first error
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
        images: product.images || [],
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

  // Inventory table columns
  const inventoryColumns = [
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: size => (
        <Tag color="blue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
          {size}
        </Tag>
      ),
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: color => {
        const colorOption = colorOptions.find(opt => opt.value === color);
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
        if (quantity === 0) {
          return (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              Out of Stock
            </Tag>
          );
        }
        if (quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK) {
          return (
            <Tag color="orange" icon={<WarningOutlined />}>
              Low Stock
            </Tag>
          );
        }
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
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      render: images => (
        <Space>
          {images &&
            images
              .slice(0, 2)
              .map((img, idx) => (
                <Image
                  key={idx}
                  width={35}
                  height={35}
                  src={img || '/placeholder.svg'}
                  style={{ borderRadius: 6, border: '1px solid #d9d9d9' }}
                  fallback="/placeholder.svg?height=35&width=35"
                />
              ))}
          {images && images.length > 2 && <Tag color="blue">+{images.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openInventoryModal(record)}
            style={{ color: '#1890ff' }}
          />
          <Popconfirm
            title="Delete inventory item"
            description="Are you sure you want to delete this inventory item?"
            onConfirm={() => deleteInventoryItem(record.size, record.color)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
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
        {/* Validation Errors Summary */}

        {/* Stock Status Alerts */}
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
          {/* Main Content */}
          <Col xs={24} lg={16}>
            {/* Basic Information */}
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>Basic Information</span>
                </Space>
              }
              bordered={false}
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

            {/* Pricing */}
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Pricing & Sales</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Row gutter={[16, 24]}>
                <Col xs={24} sm={12} data-field="price">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Regular Price * (₫)
                  </label>
                  <InputNumber
                    size="large"
                    placeholder="0.00"
                    min={0.01}
                    step={0.01}
                    value={product.price.regular}
                    onChange={value => handleNestedChange('price', 'regular', value || 0)}
                    style={{ width: '100%' }}
                    formatter={value => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
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

            {/* Product Variants */}
            <Card
              title={
                <Space>
                  <TagsOutlined />
                  <span>Product Variants (Auto-Generated from Inventory)</span>
                </Space>
              }
              bordered={false}
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
                          Size {size}
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
                  onClick={() => openInventoryModal()}
                  size="large"
                >
                  Add Inventory Item
                </Button>
              }
              bordered={false}
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
                rowKey={record => `${record.size}-${record.color}`}
                pagination={false}
                scroll={{ x: 800 }}
                locale={{
                  emptyText:
                    "No inventory items added yet. Click 'Add Inventory Item' to get started.",
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
              bordered={false}
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
            <Card
              title={
                <Space>
                  <PictureOutlined />
                  <span>Product Gallery</span>
                  <Badge count={fileList.length} style={{ backgroundColor: '#1890ff' }} />
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {product.mainImage && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      maxHeight: '200px',
                      objectFit: 'cover',
                    }}
                    src={product.mainImage || '/placeholder.svg'}
                    alt="Main Product Image"
                  />
                  <Text
                    type="secondary"
                    style={{
                      fontSize: '12px',
                      display: 'block',
                      textAlign: 'center',
                      marginTop: 4,
                    }}
                  >
                    Main Image
                  </Text>
                </div>
              )}
              <Upload.Dragger
                fileList={fileList}
                customRequest={async options => {
                  const url = await uploadToCloud(options);
                  if (url) {
                    setFileList(prev => [
                      ...prev,
                      { uid: options.file.uid, name: options.file.name, status: 'done', url },
                    ]);
                    setProduct(prev => ({
                      ...prev,
                      mainImage: url,
                      images: [...prev.images, url],
                    }));
                  }
                }}
                onRemove={file => {
                  setFileList(prev => prev.filter(f => f.uid !== file.uid));
                  setProduct(prev => ({
                    ...prev,
                    images: prev.images.filter(img => img !== file.url),
                    mainImage:
                      prev.mainImage === file.url
                        ? prev.images.filter(img => img !== file.url)[0] || ''
                        : prev.mainImage,
                  }));
                }}
                listType="picture"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                beforeUpload={file => {
                  const errors = validateFile(file);
                  if (errors.length > 0) {
                    message.error(errors.join(', '));
                    return false;
                  }
                  return true;
                }}
                style={{
                  borderRadius: 8,
                  border: '2px dashed #d9d9d9',
                  background: '#fafafa',
                }}
              >
                <p className="ant-upload-drag-icon">
                  <PlusOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 16, margin: '8px 0' }}>
                  <strong>Drop multiple images here</strong> or click to browse
                </p>
                <p className="ant-upload-hint" style={{ color: '#999', fontSize: 14 }}>
                  Support: JPG, PNG, WEBP (Max 5MB each, Max 10 images). First image becomes main
                  image.
                </p>
              </Upload.Dragger>
              {validationErrors.images && (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger" style={{ fontSize: '12px', display: 'block' }}>
                    {validationErrors.images.join(', ')}
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Card
          bordered={false}
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

        {/* Inventory Modal */}
        <Modal
          title={
            <Space>
              <ShoppingOutlined />
              {editingInventoryItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </Space>
          }
          open={inventoryModalVisible}
          onOk={handleInventorySubmit}
          onCancel={() => {
            setInventoryModalVisible(false);
            setEditingInventoryItem(null);
            setInventoryImageFileList([]);
            inventoryForm.resetFields();
          }}
          width={600}
          okText={editingInventoryItem ? 'Update Item' : 'Add Item'}
        >
          <Form form={inventoryForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="size"
                  label="Size"
                  rules={[{ required: true, message: 'Please select a size!' }]}
                >
                  <Select placeholder="Select size" size="large">
                    {sizeOptions.map(size => (
                      <Option key={size} value={size}>
                        Size {size}
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
                  <Select placeholder="Select color" size="large">
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
              </Col>
            </Row>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[
                { required: true, message: 'Please enter quantity!' },
                {
                  type: 'number',
                  min: 0,
                  max: 10000,
                  message: 'Quantity must be between 0 and 10,000',
                },
              ]}
              extra={`This will be added to the total stock automatically. Low stock threshold: ≤${STOCK_THRESHOLDS.ITEM_LOW_STOCK} units`}
            >
              <InputNumber
                placeholder="Enter quantity"
                min={0}
                max={10000}
                style={{ width: '100%' }}
                size="large"
                formatter={value => `${value} units`}
                parser={value => value.replace(' units', '')}
              />
            </Form.Item>
            <Form.Item
              name="images"
              label="Images (Optional)"
              extra="Upload multiple images for this specific inventory item"
            >
              <Upload.Dragger
                fileList={inventoryImageFileList}
                customRequest={async options => {
                  const url = await uploadToCloud(options);
                  if (url) {
                    setInventoryImageFileList(prev => [
                      ...prev,
                      { uid: options.file.uid, name: options.file.name, status: 'done', url },
                    ]);
                    const prevImgs = inventoryForm.getFieldValue('images') || [];
                    inventoryForm.setFieldsValue({ images: [...prevImgs, url] });
                  }
                }}
                onRemove={file => {
                  setInventoryImageFileList(prev => prev.filter(f => f.uid !== file.uid));
                  const prevImgs = inventoryForm.getFieldValue('images') || [];
                  inventoryForm.setFieldsValue({
                    images: prevImgs.filter(img => img !== file.url),
                  });
                }}
                listType="picture"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                beforeUpload={file => {
                  const errors = validateFile(file);
                  if (errors.length > 0) {
                    message.error(errors.join(', '));
                    return false;
                  }
                  return true;
                }}
                style={{
                  borderRadius: 8,
                  border: '2px dashed #d9d9d9',
                  background: '#fafafa',
                  padding: '20px',
                }}
              >
                <p className="ant-upload-drag-icon">
                  <PictureOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 14, margin: '8px 0' }}>
                  <strong>Drop multiple images here</strong> or click to browse
                </p>
                <p className="ant-upload-hint" style={{ color: '#999', fontSize: 12 }}>
                  Support: JPG, PNG, WEBP (Max 5MB each)
                </p>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </Modal>

        {/* Custom CSS for row highlighting */}
        <style jsx>{`
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
