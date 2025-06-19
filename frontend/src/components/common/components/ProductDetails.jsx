// import {
//   DeleteOutlined,
//   DollarOutlined,
//   EditOutlined,
//   InfoCircleOutlined,
//   PictureOutlined,
//   PlusOutlined,
//   ShoppingOutlined,
//   TagsOutlined,
// } from "@ant-design/icons"
// import {
//   Badge,
//   Button,
//   Card,
//   Col,
//   Form,
//   Image,
//   Input,
//   InputNumber,
//   message,
//   Modal,
//   Popconfirm,
//   Row,
//   Select,
//   Space,
//   Spin,
//   Switch,
//   Table,
//   Tag,
//   Typography,
//   Upload,
// } from "antd"
// import axios from "axios"
// import { useContext, useEffect, useState } from "react"
// import { useLocation, useNavigate } from "react-router-dom"
// import { ActiveTabContext } from "./ActiveTabContext"
// import TabHeader from "./TabHeader"

// const { TextArea } = Input
// const { Option } = Select
// const { Title, Text } = Typography

// const emptyProduct = {
//   name: "",
//   summary: "",
//   description: "",
//   brand: "",
//   category: "",
//   sku: "",
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
//   mainImage: "",
//   rating: 0,
//   isNew: false,
// }

// const brandOptions = ["Nike", "Adidas", "Puma", "Reebok", "New Balance", "Converse", "Vans"]

// const sizeOptions = Array.from({ length: 21 }, (_, i) => 30 + i) // 30-50

// const colorOptions = [
//   { label: "Black", value: "Black", hex: "#000000" },
//   { label: "White", value: "White", hex: "#FFFFFF" },
//   { label: "Red", value: "Red", hex: "#FF0000" },
//   { label: "Blue", value: "Blue", hex: "#0000FF" },
//   { label: "Green", value: "Green", hex: "#008000" },
//   { label: "Yellow", value: "Yellow", hex: "#FFFF00" },
//   { label: "Gray", value: "Gray", hex: "#808080" },
//   { label: "Brown", value: "Brown", hex: "#A52A2A" },
//   { label: "Navy", value: "Navy", hex: "#000080" },
//   { label: "Pink", value: "Pink", hex: "#FFC0CB" },
// ]

// export default function ProductDetails() {
//   const { setActiveTab } = useContext(ActiveTabContext)
//   const location = useLocation()
//   const navigate = useNavigate()
//   const isAddNew = location.pathname.includes("add-new")

//   const [product, setProduct] = useState(emptyProduct)
//   const [categories, setCategories] = useState([])
//   const [fileList, setFileList] = useState([])
//   const [inventoryModalVisible, setInventoryModalVisible] = useState(false)
//   const [editingInventoryItem, setEditingInventoryItem] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [pageLoading, setPageLoading] = useState(true)
//   const [inventoryForm] = Form.useForm()

//   // Get auth headers with cache busting
//   const getAuthHeaders = () => {
//     const userInfo = localStorage.getItem("userInfo")
//     const token = userInfo ? JSON.parse(userInfo).token : null
//     return {
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       "Cache-Control": "no-cache",
//       Pragma: "no-cache",
//       Expires: "0",
//     }
//   }

//   // Fetch categories and product data
//   useEffect(() => {
//     setActiveTab("2")
//     fetchInitialData()
//   }, [setActiveTab, isAddNew, location.pathname])

//   const fetchInitialData = async () => {
//     setPageLoading(true)
//     try {
//       // Fetch categories
//       await fetchCategories()

//       // Fetch product details if not add-new
//       if (!isAddNew) {
//         const productId = location.pathname.split("/").pop()
//         await fetchProductDetails(productId)
//       }
//     } catch (error) {
//       console.error("Error fetching initial data:", error)
//     } finally {
//       setPageLoading(false)
//     }
//   }

//   const fetchCategories = async () => {
//     try {
//       const response = await axios.get(`/api/categories?t=${Date.now()}`, {
//         headers: getAuthHeaders(),
//       })
//       if (response.data && response.data.data) {
//         setCategories(response.data.data)
//       }
//     } catch (error) {
//       console.error("Error fetching categories:", error)
//       message.error("Failed to fetch categories!")
//     }
//   }

//   const fetchProductDetails = async (productId) => {
//     try {
//       // Add timestamp to prevent caching
//       const response = await axios.get(`/api/products/${productId}?t=${Date.now()}`, {
//         headers: getAuthHeaders(),
//       })

//       if (response.data && response.data.data) {
//         const productData = response.data.data
//         setProduct(productData)

//         // Set up file list for images based on original code pattern
//         if (productData.mainImage || (productData.images && productData.images.length > 0)) {
//           const images = productData.images || [productData.mainImage]
//           setFileList(
//             images.filter(Boolean).map((img, idx) => ({
//               uid: String(idx),
//               name: `Product thumbnail.png`,
//               status: "done",
//               url: img,
//             })),
//           )
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching product details:", error)
//       message.error("Failed to fetch product details!")
//     }
//   }

//   const handleChange = (field, value) => {
//     setProduct((prev) => ({ ...prev, [field]: value }))
//   }

//   const handleNestedChange = (parentField, childField, value) => {
//     setProduct((prev) => ({
//       ...prev,
//       [parentField]: {
//         ...prev[parentField],
//         [childField]: value,
//       },
//     }))
//   }

//   const calculateTotalStock = (inventory) => {
//     return inventory.reduce((total, item) => total + item.quantity, 0)
//   }

//   const calculateSalePrice = () => {
//     if (product.price.regular && product.price.discountPercent) {
//       return product.price.regular * (1 - product.price.discountPercent / 100)
//     }
//     return product.price.regular
//   }

//   // Handle file upload - based on original code
//   const handleUploadChange = ({ fileList: newFileList }) => {
//     setFileList(newFileList)
//     setProduct((prev) => ({
//       ...prev,
//       images: newFileList.map((f) => f.url || f.thumbUrl),
//       mainImage: newFileList.length > 0 ? newFileList[0].url || newFileList[0].thumbUrl : "",
//     }))
//   }

//   // Inventory Management Functions
//   const openInventoryModal = (item) => {
//     setEditingInventoryItem(item || null)
//     if (item) {
//       inventoryForm.setFieldsValue(item)
//     } else {
//       inventoryForm.resetFields()
//     }
//     setInventoryModalVisible(true)
//   }

//   const handleInventorySubmit = async () => {
//     try {
//       const values = await inventoryForm.validateFields()
//       const newItem = {
//         size: values.size,
//         color: values.color,
//         quantity: values.quantity,
//         isAvailable: values.quantity > 0,
//         images: values.images || [],
//       }

//       let updatedInventory
//       if (editingInventoryItem) {
//         // Update existing item
//         updatedInventory = product.inventory.map((item) =>
//           item.size === editingInventoryItem.size && item.color === editingInventoryItem.color ? newItem : item,
//         )
//       } else {
//         // Check if combination already exists
//         const existingItem = product.inventory.find((item) => item.size === values.size && item.color === values.color)
//         if (existingItem) {
//           message.error("This size and color combination already exists!")
//           return
//         }
//         // Add new item
//         updatedInventory = [...product.inventory, newItem]
//       }

//       const totalStock = calculateTotalStock(updatedInventory)
//       setProduct((prev) => ({
//         ...prev,
//         inventory: updatedInventory,
//         stock: totalStock,
//       }))

//       setInventoryModalVisible(false)
//       setEditingInventoryItem(null)
//       inventoryForm.resetFields()
//       message.success(editingInventoryItem ? "Inventory item updated!" : "Inventory item added!")
//     } catch (error) {
//       console.error("Validation failed:", error)
//     }
//   }

//   const deleteInventoryItem = (size, color) => {
//     const updatedInventory = product.inventory.filter((item) => !(item.size === size && item.color === color))
//     const totalStock = calculateTotalStock(updatedInventory)
//     setProduct((prev) => ({
//       ...prev,
//       inventory: updatedInventory,
//       stock: totalStock,
//     }))
//     message.success("Inventory item deleted!")
//   }

//   // API Functions - based on original code structure
//   const handleCreate = async () => {
//     try {
//       const userInfo = localStorage.getItem("userInfo")
//       const token = userInfo ? JSON.parse(userInfo).token : null

//       const payload = {
//         name: product.name,
//         summary: product.summary,
//         description: product.description,
//         brand: product.brand,
//         category: product.category,
//         price: {
//           regular: Number(product.price.regular),
//           discountPercent: Number(product.price.discountPercent),
//           isOnSale: Boolean(product.price.isOnSale),
//         },
//         variants: {
//           sizes: product.variants.sizes,
//           colors: product.variants.colors,
//         },
//         inventory: product.inventory,
//         images: product.images,
//         tags: product.tags,
//         status: product.status,
//         stock: product.stock,
//         isNew: product.isNew,
//       }

//       await axios.post("/api/products/add", payload, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//       })
//       message.success("Product created successfully!")
//       // Navigate back or refresh parent component
//       window.location.href = "/dashboard/products" // Force full page reload to ensure fresh data
//     } catch (err) {
//       message.error("Failed to create product!")
//     }
//   }

//   const handleUpdate = async () => {
//     try {
//       const userInfo = localStorage.getItem("userInfo")
//       const token = userInfo ? JSON.parse(userInfo).token : null
//       const productId = product._id || product.id

//       const payload = {
//         name: product.name,
//         summary: product.summary,
//         description: product.description,
//         brand: product.brand,
//         category: product.category,
//         price: {
//           regular: Number(product.price.regular),
//           discountPercent: Number(product.price.discountPercent),
//           isOnSale: Boolean(product.price.isOnSale),
//         },
//         variants: {
//           sizes: product.variants.sizes,
//           colors: product.variants.colors,
//         },
//         inventory: product.inventory,
//         images: product.images,
//         tags: product.tags,
//         status: product.status,
//         stock: product.stock,
//         isNew: product.isNew,
//       }

//       await axios.put(`/api/products/${productId}`, payload, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//       })
//       message.success("Product updated successfully!")

//       // Force refresh data after update
//       setTimeout(async () => {
//         await fetchProductDetails(productId)
//         // Optional: Navigate back to products list
//         window.location.href = "/dashboard/products"
//       }, 1000)
//     } catch (err) {
//       message.error("Failed to update product!")
//     }
//   }

//   const handleDelete = async () => {
//     try {
//       const userInfo = localStorage.getItem("userInfo")
//       const token = userInfo ? JSON.parse(userInfo).token : null
//       const productId = product._id || product.id

//       await axios.delete(`/api/products/${productId}/delete`, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//       })
//       message.success("Product deleted successfully!")
//       // Force navigation back to products list
//       window.location.href = "/dashboard/products"
//     } catch (err) {
//       message.error("Failed to delete product!")
//     }
//   }

//   const handleCancel = () => {
//     message.info("Changes canceled")
//     window.location.href = "/dashboard/products"
//   }

//   // Inventory table columns
//   const inventoryColumns = [
//     {
//       title: "Size",
//       dataIndex: "size",
//       key: "size",
//       render: (size) => <Tag color="blue">{size}</Tag>,
//     },
//     {
//       title: "Color",
//       dataIndex: "color",
//       key: "color",
//       render: (color) => {
//         const colorOption = colorOptions.find((opt) => opt.value === color)
//         return (
//           <Space>
//             <div
//               style={{
//                 width: 16,
//                 height: 16,
//                 backgroundColor: colorOption?.hex || "#ccc",
//                 border: "1px solid #d9d9d9",
//                 borderRadius: 2,
//               }}
//             />
//             {color}
//           </Space>
//         )
//       },
//     },
//     {
//       title: "Quantity",
//       dataIndex: "quantity",
//       key: "quantity",
//       render: (quantity) => (
//         <Badge count={quantity} style={{ backgroundColor: quantity > 0 ? "#52c41a" : "#ff4d4f" }} />
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "isAvailable",
//       key: "isAvailable",
//       render: (isAvailable) => (
//         <Tag color={isAvailable ? "green" : "red"}>{isAvailable ? "Available" : "Out of Stock"}</Tag>
//       ),
//     },
//     {
//       title: "SKU",
//       dataIndex: "sku",
//       key: "sku",
//       render: (sku) => sku || "Auto-generated",
//     },
//     {
//       title: "Images",
//       dataIndex: "images",
//       key: "images",
//       render: (images) => (
//         <Space>
//           {images &&
//             images
//               .slice(0, 3)
//               .map((img, idx) => (
//                 <Image
//                   key={idx}
//                   width={30}
//                   height={30}
//                   src={img || "/placeholder.svg"}
//                   style={{ borderRadius: 4 }}
//                   fallback="/placeholder.svg?height=30&width=30"
//                 />
//               ))}
//           {images && images.length > 3 && <span>+{images.length - 3}</span>}
//         </Space>
//       ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, record) => (
//         <Space>
//           <Button type="link" icon={<EditOutlined />} onClick={() => openInventoryModal(record)} />
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
//   ]

//   if (pageLoading) {
//     return (
//       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
//         <Spin size="large" />
//       </div>
//     )
//   }

//   return (
//     <div>
//       <TabHeader breadcrumb="All Products" anotherBreadcrumb={isAddNew ? "Add New Product" : "Product Details"} />

//       <div className="product-details-container" style={{ padding: "24px", background: "#f5f5f5" }}>
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
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Name *</label>
//                   <Input
//                     size="large"
//                     placeholder="Enter product name"
//                     value={product.name}
//                     onChange={(e) => handleChange("name", e.target.value)}
//                   />
//                 </Col>

//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Summary</label>
//                   <Input
//                     size="large"
//                     placeholder="Brief product summary"
//                     value={product.summary}
//                     onChange={(e) => handleChange("summary", e.target.value)}
//                   />
//                 </Col>

//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Description</label>
//                   <TextArea
//                     placeholder="Detailed product description"
//                     value={product.description}
//                     onChange={(e) => handleChange("description", e.target.value)}
//                     rows={4}
//                     style={{ resize: "none" }}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="Category"
//                     name="category"
//                     rules={[{ required: true, message: "Please select a category!" }]}
//                     style={{ marginBottom: 16 }}
//                   >
//                     <Select
//                       size="large"
//                       placeholder="Select a category"
//                       value={product.category}
//                       onChange={(value) => handleChange("category", value)}
//                       style={{ width: "100%" }}
//                       showSearch
//                       optionFilterProp="children"
//                       filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
//                       aria-label="Product category"
//                     >
//                       {categories.map((cat) => (
//                         <Option key={cat._id} value={cat._id}>
//                           {cat.name}
//                         </Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     label="Brand"
//                     name="brand"
//                     rules={[{ required: true, message: "Please select a brand!" }]}
//                     style={{ marginBottom: 16 }}
//                   >
//                     <Select
//                       size="large"
//                       placeholder="Select a brand"
//                       value={product.brand}
//                       onChange={(value) => handleChange("brand", value)}
//                       style={{ width: "100%" }}
//                       showSearch
//                       optionFilterProp="children"
//                       filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
//                       aria-label="Product brand"
//                     >
//                       {brandOptions.map((brand) => (
//                         <Option key={brand} value={brand}>
//                           {brand}
//                         </Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Stock Quantity *</label>
//                   <InputNumber
//                     size="large"
//                     placeholder="0"
//                     min={0}
//                     value={product.stock}
//                     onChange={(value) => handleChange("stock", value || 0)}
//                     style={{ width: "100%" }}
//                   />
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
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Regular Price * ($)</label>
//                   <InputNumber
//                     size="large"
//                     placeholder="0.00"
//                     min={0}
//                     step={0.01}
//                     value={product.price.regular}
//                     onChange={(value) => handleNestedChange("price", "regular", value || 0)}
//                     style={{ width: "100%" }}
//                     formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
//                     parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Discount Percentage (%)</label>
//                   <InputNumber
//                     size="large"
//                     placeholder="0"
//                     min={0}
//                     max={100}
//                     value={product.price.discountPercent}
//                     onChange={(value) => handleNestedChange("price", "discountPercent", value || 0)}
//                     style={{ width: "100%" }}
//                     formatter={(value) => `${value}%`}
//                     parser={(value) => value.replace("%", "")}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Space direction="vertical" style={{ width: "100%" }}>
//                     <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>On Sale</label>
//                     <Switch
//                       checked={product.price.isOnSale}
//                       onChange={(checked) => handleNestedChange("price", "isOnSale", checked)}
//                       checkedChildren="Yes"
//                       unCheckedChildren="No"
//                     />
//                   </Space>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Sale Price ($)</label>
//                   <div
//                     style={{
//                       padding: "8px 12px",
//                       background: "#f0f0f0",
//                       borderRadius: "6px",
//                       fontSize: "16px",
//                       fontWeight: 600,
//                       color: "#52c41a",
//                     }}
//                   >
//                     ${calculateSalePrice().toFixed(2)}
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Product Variants */}
//             <Card
//               title={
//                 <Space>
//                   <TagsOutlined />
//                   <span>Product Variants</span>
//                 </Space>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 marginBottom: 24,
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Available Sizes</label>
//                   <Select
//                     mode="multiple"
//                     size="large"
//                     placeholder="Select available sizes"
//                     value={product.variants.sizes}
//                     onChange={(sizes) => handleNestedChange("variants", "sizes", sizes)}
//                     style={{ width: "100%" }}
//                     options={sizeOptions.map((size) => ({
//                       label: size,
//                       value: size,
//                     }))}
//                   />
//                 </Col>

//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Available Colors</label>
//                   <Select
//                     mode="multiple"
//                     size="large"
//                     placeholder="Select available colors"
//                     value={product.variants.colors}
//                     onChange={(colors) => handleNestedChange("variants", "colors", colors)}
//                     style={{ width: "100%" }}
//                   >
//                     {colorOptions.map((color) => (
//                       <Option key={color.value} value={color.value}>
//                         <Space>
//                           <div
//                             style={{
//                               width: 16,
//                               height: 16,
//                               backgroundColor: color.hex,
//                               border: "1px solid #d9d9d9",
//                               borderRadius: 2,
//                             }}
//                           />
//                           {color.label}
//                         </Space>
//                       </Option>
//                     ))}
//                   </Select>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Inventory Management */}
//             <Card
//               title={
//                 <Space>
//                   <ShoppingOutlined />
//                   <span>Inventory Management</span>
//                   <Badge count={product.inventory.length} style={{ backgroundColor: "#1890ff" }} />
//                 </Space>
//               }
//               extra={
//                 <Button type="primary" icon={<PlusOutlined />} onClick={() => openInventoryModal()}>
//                   Add Inventory Item
//                 </Button>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 marginBottom: 24,
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//               }}
//             >
//               <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24} sm={8}>
//                   <Card size="small" style={{ textAlign: "center" }}>
//                     <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
//                       {product.stock}
//                     </Title>
//                     <Text type="secondary">Total Stock</Text>
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={8}>
//                   <Card size="small" style={{ textAlign: "center" }}>
//                     <Title level={4} style={{ margin: 0, color: "#52c41a" }}>
//                       {product.inventory.filter((item) => item.isAvailable).length}
//                     </Title>
//                     <Text type="secondary">Available Items</Text>
//                   </Card>
//                 </Col>
//                 <Col xs={24} sm={8}>
//                   <Card size="small" style={{ textAlign: "center" }}>
//                     <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>
//                       {product.inventory.filter((item) => !item.isAvailable).length}
//                     </Title>
//                     <Text type="secondary">Out of Stock</Text>
//                   </Card>
//                 </Col>
//               </Row>

//               <Table
//                 columns={inventoryColumns}
//                 dataSource={product.inventory}
//                 rowKey={(record) => `${record.size}-${record.color}`}
//                 pagination={false}
//                 scroll={{ x: 800 }}
//                 locale={{ emptyText: "No inventory items added yet" }}
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
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//               }}
//             >
//               <Row gutter={[16, 24]}>
//                 <Col span={24}>
//                   <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Tags</label>
//                   <Select
//                     mode="tags"
//                     size="large"
//                     placeholder="Add tags (press Enter to add)"
//                     value={product.tags}
//                     onChange={(tags) => handleChange("tags", tags)}
//                     style={{ width: "100%" }}
//                   />
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Space direction="vertical" style={{ width: "100%" }}>
//                     <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Status</label>
//                     <Switch
//                       checked={product.status}
//                       onChange={(checked) => handleChange("status", checked)}
//                       checkedChildren="Active"
//                       unCheckedChildren="Inactive"
//                     />
//                   </Space>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Space direction="vertical" style={{ width: "100%" }}>
//                     <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>New Product</label>
//                     <Switch
//                       checked={product.isNew}
//                       onChange={(checked) => handleChange("isNew", checked)}
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
//                 </Space>
//               }
//               bordered={false}
//               style={{
//                 borderRadius: 12,
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//               }}
//             >
//               {product.images && product.images.length > 0 && (
//                 <div style={{ marginBottom: 16 }}>
//                   <img
//                     style={{
//                       width: "100%",
//                       borderRadius: "12px",
//                       maxHeight: "200px",
//                       objectFit: "cover",
//                     }}
//                     src={product.images[0] || "/placeholder.svg"}
//                     alt="Product Preview"
//                   />
//                 </div>
//               )}

//               <Upload.Dragger
//                 fileList={fileList}
//                 onChange={handleUploadChange}
//                 listType="picture"
//                 accept=".png,.jpg,.jpeg,.webp"
//                 multiple
//                 showUploadList={{ showRemoveIcon: true }}
//                 beforeUpload={() => false}
//                 style={{
//                   borderRadius: 8,
//                   border: "2px dashed #d9d9d9",
//                   background: "#fafafa",
//                 }}
//               >
//                 <p className="ant-upload-drag-icon">
//                   <PlusOutlined style={{ fontSize: 24, color: "#1890ff" }} />
//                 </p>
//                 <p className="ant-upload-text" style={{ fontSize: 16, margin: "8px 0" }}>
//                   <strong>Drop images here</strong> or click to browse
//                 </p>
//                 <p className="ant-upload-hint" style={{ color: "#999", fontSize: 14 }}>
//                   Support: JPG, PNG, WEBP (Max 5MB each)
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
//             textAlign: "center",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//           }}
//         >
//           <Space size="large">
//             {isAddNew ? (
//               <Button type="primary" size="large" onClick={handleCreate} style={{ minWidth: 120, height: 48 }}>
//                 Create Product
//               </Button>
//             ) : (
//               <>
//                 <Button type="primary" size="large" onClick={handleUpdate} style={{ minWidth: 120, height: 48 }}>
//                   Update Product
//                 </Button>
//                 <Button
//                   danger
//                   size="large"
//                   icon={<DeleteOutlined />}
//                   onClick={handleDelete}
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
//           title={editingInventoryItem ? "Edit Inventory Item" : "Add Inventory Item"}
//           open={inventoryModalVisible}
//           onOk={handleInventorySubmit}
//           onCancel={() => {
//             setInventoryModalVisible(false)
//             setEditingInventoryItem(null)
//             inventoryForm.resetFields()
//           }}
//           width={600}
//         >
//           <Form form={inventoryForm} layout="vertical">
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item name="size" label="Size" rules={[{ required: true, message: "Please select a size!" }]}>
//                   <Select placeholder="Select size" size="large">
//                     {sizeOptions.map((size) => (
//                       <Option key={size} value={size}>
//                         {size}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item name="color" label="Color" rules={[{ required: true, message: "Please select a color!" }]}>
//                   <Select placeholder="Select color" size="large">
//                     {colorOptions.map((color) => (
//                       <Option key={color.value} value={color.value}>
//                         <Space>
//                           <div
//                             style={{
//                               width: 16,
//                               height: 16,
//                               backgroundColor: color.hex,
//                               border: "1px solid #d9d9d9",
//                               borderRadius: 2,
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
//             <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: "Please enter quantity!" }]}>
//               <InputNumber placeholder="Enter quantity" min={0} style={{ width: "100%" }} size="large" />
//             </Form.Item>
//             <Form.Item name="images" label="Images (Optional)">
//               <Select mode="tags" placeholder="Add image URLs" style={{ width: "100%" }} size="large" />
//             </Form.Item>
//           </Form>
//         </Modal>
//       </div>
//     </div>
//   )
// }
"use client"

import { useState, useEffect, useContext } from "react"
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
} from "@ant-design/icons"
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
  Progress,
  Alert,
  Statistic,
  Tooltip,
} from "antd"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { ActiveTabContext } from "./ActiveTabContext"
import TabHeader from "./TabHeader"

const { TextArea } = Input
const { Option } = Select
const { Title, Text } = Typography

const emptyProduct = {
  name: "",
  summary: "",
  description: "",
  brand: "",
  category: "",
  sku: "",
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
  mainImage: "",
  rating: 0,
  isNew: false,
}

const brandOptions = ["Nike", "Adidas", "Puma", "Reebok", "New Balance", "Converse", "Vans"]

const sizeOptions = Array.from({ length: 21 }, (_, i) => 30 + i) // 30-50

const colorOptions = [
  { label: "Black", value: "Black", hex: "#000000" },
  { label: "White", value: "White", hex: "#FFFFFF" },
  { label: "Red", value: "Red", hex: "#FF0000" },
  { label: "Blue", value: "Blue", hex: "#0000FF" },
  { label: "Green", value: "Green", hex: "#008000" },
  { label: "Yellow", value: "Yellow", hex: "#FFFF00" },
  { label: "Gray", value: "Gray", hex: "#808080" },
  { label: "Brown", value: "Brown", hex: "#A52A2A" },
  { label: "Navy", value: "Navy", hex: "#000080" },
  { label: "Pink", value: "Pink", hex: "#FFC0CB" },
]

// Stock thresholds
const STOCK_THRESHOLDS = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 10,
  MEDIUM_STOCK: 50,
  ITEM_LOW_STOCK: 5, // For individual inventory items
}

export default function ProductDetails() {
  const { setActiveTab } = useContext(ActiveTabContext)
  const location = useLocation()
  const navigate = useNavigate()
  const isAddNew = location.pathname.includes("add-new")

  const [product, setProduct] = useState(emptyProduct)
  const [categories, setCategories] = useState([])
  const [fileList, setFileList] = useState([])
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false)
  const [editingInventoryItem, setEditingInventoryItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [inventoryForm] = Form.useForm()

  // Get auth headers with cache busting
  const getAuthHeaders = () => {
    const userInfo = localStorage.getItem("userInfo")
    const token = userInfo ? JSON.parse(userInfo).token : null
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    }
  }

  // Fetch categories and product data
  useEffect(() => {
    setActiveTab("2")
    fetchInitialData()
  }, [setActiveTab, isAddNew, location.pathname])

  const fetchInitialData = async () => {
    setPageLoading(true)
    try {
      // Fetch categories
      await fetchCategories()

      // Fetch product details if not add-new
      if (!isAddNew) {
        const productId = location.pathname.split("/").pop()
        await fetchProductDetails(productId)
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`/api/categories?t=${Date.now()}`, {
        headers: getAuthHeaders(),
      })
      if (response.data && response.data.data) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      message.error("Failed to fetch categories!")
    }
  }

  const fetchProductDetails = async (productId) => {
    try {
      // Add timestamp to prevent caching
      const response = await axios.get(`/api/products/${productId}?t=${Date.now()}`, {
        headers: getAuthHeaders(),
      })

      if (response.data && response.data.data) {
        const productData = response.data.data
        // Auto-calculate stock from inventory
        const calculatedStock = calculateTotalStock(productData.inventory || [])
        setProduct({ ...productData, stock: calculatedStock })

        // Set up file list for images based on original code pattern
        if (productData.mainImage || (productData.images && productData.images.length > 0)) {
          const images = productData.images || [productData.mainImage]
          setFileList(
            images.filter(Boolean).map((img, idx) => ({
              uid: String(idx),
              name: `Product thumbnail.png`,
              status: "done",
              url: img,
            })),
          )
        }
      }
    } catch (error) {
      console.error("Error fetching product details:", error)
      message.error("Failed to fetch product details!")
    }
  }

  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }))
  }

  const handleNestedChange = (parentField, childField, value) => {
    setProduct((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }))
  }

  // Auto-calculate total stock from inventory
  const calculateTotalStock = (inventory) => {
    return inventory.reduce((total, item) => total + (item.quantity || 0), 0)
  }

  // Calculate low stock items
  const calculateLowStockItems = (inventory) => {
    return inventory.filter((item) => item.quantity > 0 && item.quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK)
  }

  // Calculate out of stock items
  const calculateOutOfStockItems = (inventory) => {
    return inventory.filter((item) => item.quantity === 0)
  }

  // Calculate available items
  const calculateAvailableItems = (inventory) => {
    return inventory.filter((item) => item.quantity > STOCK_THRESHOLDS.ITEM_LOW_STOCK)
  }

  // Update stock whenever inventory changes
  useEffect(() => {
    const newStock = calculateTotalStock(product.inventory)
    if (newStock !== product.stock) {
      setProduct((prev) => ({ ...prev, stock: newStock }))
    }
  }, [product.inventory])

  const calculateSalePrice = () => {
    if (product.price.regular && product.price.discountPercent) {
      return product.price.regular * (1 - product.price.discountPercent / 100)
    }
    return product.price.regular
  }

  // Handle file upload - based on original code
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)
    setProduct((prev) => ({
      ...prev,
      images: newFileList.map((f) => f.url || f.thumbUrl),
      mainImage: newFileList.length > 0 ? newFileList[0].url || newFileList[0].thumbUrl : "",
    }))
  }

  // Inventory Management Functions
  const openInventoryModal = (item) => {
    setEditingInventoryItem(item || null)
    if (item) {
      inventoryForm.setFieldsValue(item)
    } else {
      inventoryForm.resetFields()
    }
    setInventoryModalVisible(true)
  }

  const handleInventorySubmit = async () => {
    try {
      const values = await inventoryForm.validateFields()
      const newItem = {
        size: values.size,
        color: values.color,
        quantity: values.quantity,
        isAvailable: values.quantity > 0,
        images: values.images || [],
      }

      let updatedInventory
      if (editingInventoryItem) {
        // Update existing item
        updatedInventory = product.inventory.map((item) =>
          item.size === editingInventoryItem.size && item.color === editingInventoryItem.color ? newItem : item,
        )
      } else {
        // Check if combination already exists
        const existingItem = product.inventory.find((item) => item.size === values.size && item.color === values.color)
        if (existingItem) {
          message.error("This size and color combination already exists!")
          return
        }
        // Add new item
        updatedInventory = [...product.inventory, newItem]
      }

      // Auto-calculate total stock
      const totalStock = calculateTotalStock(updatedInventory)
      setProduct((prev) => ({
        ...prev,
        inventory: updatedInventory,
        stock: totalStock,
      }))

      setInventoryModalVisible(false)
      setEditingInventoryItem(null)
      inventoryForm.resetFields()
      message.success(editingInventoryItem ? "Inventory item updated!" : "Inventory item added!")
    } catch (error) {
      console.error("Validation failed:", error)
    }
  }

  const deleteInventoryItem = (size, color) => {
    const updatedInventory = product.inventory.filter((item) => !(item.size === size && item.color === color))
    const totalStock = calculateTotalStock(updatedInventory)
    setProduct((prev) => ({
      ...prev,
      inventory: updatedInventory,
      stock: totalStock,
    }))
    message.success("Inventory item deleted!")
  }

  // Get stock status for visual display
  const getStockStatus = () => {
    const stock = product.stock
    if (stock === STOCK_THRESHOLDS.OUT_OF_STOCK) {
      return { status: "error", text: "Out of Stock", color: "#ff4d4f", icon: <ExclamationCircleOutlined /> }
    }
    if (stock <= STOCK_THRESHOLDS.LOW_STOCK) {
      return { status: "warning", text: "Low Stock", color: "#faad14", icon: <WarningOutlined /> }
    }
    if (stock <= STOCK_THRESHOLDS.MEDIUM_STOCK) {
      return { status: "normal", text: "In Stock", color: "#1890ff", icon: <InfoCircleOutlined /> }
    }
    return { status: "success", text: "Well Stocked", color: "#52c41a", icon: <CheckCircleOutlined /> }
  }

  // API Functions - Updated navigation paths
  const handleCreate = async () => {
    try {
      const userInfo = localStorage.getItem("userInfo")
      const token = userInfo ? JSON.parse(userInfo).token : null

      const payload = {
        name: product.name,
        summary: product.summary,
        description: product.description,
        brand: product.brand,
        category: product.category,
        price: {
          regular: Number(product.price.regular),
          discountPercent: Number(product.price.discountPercent),
          isOnSale: Boolean(product.price.isOnSale),
        },
        variants: {
          sizes: product.variants.sizes,
          colors: product.variants.colors,
        },
        inventory: product.inventory,
        images: product.images,
        tags: product.tags,
        status: product.status,
        stock: product.stock, // Auto-calculated stock
        isNew: product.isNew,
      }

      await axios.post("/api/products/add", payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      message.success("Product created successfully!")
      window.location.href = "/dashboard/products" // Updated path
    } catch (err) {
      message.error("Failed to create product!")
    }
  }

  const handleUpdate = async () => {
    try {
      const userInfo = localStorage.getItem("userInfo")
      const token = userInfo ? JSON.parse(userInfo).token : null
      const productId = product._id || product.id

      const payload = {
        name: product.name,
        summary: product.summary,
        description: product.description,
        brand: product.brand,
        category: product.category,
        price: {
          regular: Number(product.price.regular),
          discountPercent: Number(product.price.discountPercent),
          isOnSale: Boolean(product.price.isOnSale),
        },
        variants: {
          sizes: product.variants.sizes,
          colors: product.variants.colors,
        },
        inventory: product.inventory,
        images: product.images,
        tags: product.tags,
        status: product.status,
        stock: product.stock, // Auto-calculated stock
        isNew: product.isNew,
      }

      await axios.put(`/api/products/${productId}`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      message.success("Product updated successfully!")

      setTimeout(async () => {
        await fetchProductDetails(productId)
        window.location.href = "/dashboard/products" // Updated path
      }, 1000)
    } catch (err) {
      message.error("Failed to update product!")
    }
  }

  const handleDelete = async () => {
    try {
      const userInfo = localStorage.getItem("userInfo")
      const token = userInfo ? JSON.parse(userInfo).token : null
      const productId = product._id || product.id

      await axios.delete(`/api/products/${productId}/delete`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      message.success("Product deleted successfully!")
      window.location.href = "/dashboard/products" // Updated path
    } catch (err) {
      message.error("Failed to delete product!")
    }
  }

  const handleCancel = () => {
    message.info("Changes canceled")
    window.location.href = "/dashboard/products" // Updated path
  }

  // Inventory table columns
  const inventoryColumns = [
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (size) => (
        <Tag color="blue" style={{ fontSize: "12px", fontWeight: "bold" }}>
          {size}
        </Tag>
      ),
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
      render: (color) => {
        const colorOption = colorOptions.find((opt) => opt.value === color)
        return (
          <Space>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: colorOption?.hex || "#ccc",
                border: "2px solid #d9d9d9",
                borderRadius: 4,
              }}
            />
            <Text strong>{color}</Text>
          </Space>
        )
      },
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => (
        <div style={{ textAlign: "center" }}>
          <Badge
            count={quantity}
            style={{
              backgroundColor:
                quantity > STOCK_THRESHOLDS.ITEM_LOW_STOCK ? "#52c41a" : quantity > 0 ? "#faad14" : "#ff4d4f",
              fontSize: "14px",
              fontWeight: "bold",
              minWidth: "40px",
              height: "24px",
              lineHeight: "24px",
            }}
          />
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isAvailable",
      key: "isAvailable",
      render: (isAvailable, record) => {
        const quantity = record.quantity
        if (quantity === 0) {
          return (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              Out of Stock
            </Tag>
          )
        }
        if (quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK) {
          return (
            <Tag color="orange" icon={<WarningOutlined />}>
              Low Stock
            </Tag>
          )
        }
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            In Stock
          </Tag>
        )
      },
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      render: (sku) => <Text type="secondary">{sku || "Auto-generated"}</Text>,
    },
    {
      title: "Images",
      dataIndex: "images",
      key: "images",
      render: (images) => (
        <Space>
          {images &&
            images
              .slice(0, 2)
              .map((img, idx) => (
                <Image
                  key={idx}
                  width={35}
                  height={35}
                  src={img || "/placeholder.svg"}
                  style={{ borderRadius: 6, border: "1px solid #d9d9d9" }}
                  fallback="/placeholder.svg?height=35&width=35"
                />
              ))}
          {images && images.length > 2 && <Tag color="blue">+{images.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openInventoryModal(record)}
            style={{ color: "#1890ff" }}
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
  ]

  const stockStatus = getStockStatus()
  const lowStockItems = calculateLowStockItems(product.inventory)
  const outOfStockItems = calculateOutOfStockItems(product.inventory)
  const availableItems = calculateAvailableItems(product.inventory)

  if (pageLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <TabHeader breadcrumb="All Products" anotherBreadcrumb={isAddNew ? "Add New Product" : "Product Details"} />

      <div className="product-details-container" style={{ padding: "24px", background: "#f5f5f5" }}>
        {/* Enhanced Stock Status Alerts */}
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Row gutter={[16, 24]}>
                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Name *</label>
                  <Input
                    size="large"
                    placeholder="Enter product name"
                    value={product.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </Col>

                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Summary</label>
                  <Input
                    size="large"
                    placeholder="Brief product summary"
                    value={product.summary}
                    onChange={(e) => handleChange("summary", e.target.value)}
                  />
                </Col>

                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Description</label>
                  <TextArea
                    placeholder="Detailed product description"
                    value={product.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={4}
                    style={{ resize: "none" }}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: "Please select a category!" }]}
                    style={{ marginBottom: 16 }}
                  >
                    <Select
                      size="large"
                      placeholder="Select a category"
                      value={product.category}
                      onChange={(value) => handleChange("category", value)}
                      style={{ width: "100%" }}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                      aria-label="Product category"
                    >
                      {categories.map((cat) => (
                        <Option key={cat._id} value={cat._id}>
                          {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Brand"
                    name="brand"
                    rules={[{ required: true, message: "Please select a brand!" }]}
                    style={{ marginBottom: 16 }}
                  >
                    <Select
                      size="large"
                      placeholder="Select a brand"
                      value={product.brand}
                      onChange={(value) => handleChange("brand", value)}
                      style={{ width: "100%" }}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                      aria-label="Product brand"
                    >
                      {brandOptions.map((brand) => (
                        <Option key={brand} value={brand}>
                          {brand}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                {/* Enhanced Auto-calculated Stock Display */}
                <Col xs={24} sm={12}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>
                    Total Stock Quantity (Auto-calculated)
                  </label>
                  <div
                    style={{
                      padding: "12px 16px",
                      background: stockStatus.color + "15",
                      border: `2px solid ${stockStatus.color}`,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: "18px", color: stockStatus.color }}>
                        {product.stock} units
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {stockStatus.text}
                      </Text>
                      {lowStockItems.length > 0 && (
                        <>
                          <br />
                          <Text type="warning" style={{ fontSize: "11px" }}>
                            {lowStockItems.length} items need restocking
                          </Text>
                        </>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: stockStatus.color, fontSize: "20px" }}>{stockStatus.icon}</div>
                      {lowStockItems.length > 0 && (
                        <Badge count={lowStockItems.length} style={{ backgroundColor: "#faad14", marginTop: 4 }} />
                      )}
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Row gutter={[16, 24]}>
                <Col xs={24} sm={12}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Regular Price * ($)</label>
                  <InputNumber
                    size="large"
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    value={product.price.regular}
                    onChange={(value) => handleNestedChange("price", "regular", value || 0)}
                    style={{ width: "100%" }}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Discount Percentage (%)</label>
                  <InputNumber
                    size="large"
                    placeholder="0"
                    min={0}
                    max={100}
                    value={product.price.discountPercent}
                    onChange={(value) => handleNestedChange("price", "discountPercent", value || 0)}
                    style={{ width: "100%" }}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace("%", "")}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>On Sale</label>
                    <Switch
                      checked={product.price.isOnSale}
                      onChange={(checked) => handleNestedChange("price", "isOnSale", checked)}
                      checkedChildren="Yes"
                      unCheckedChildren="No"
                    />
                  </Space>
                </Col>

                <Col xs={24} sm={12}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Sale Price ($)</label>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f0f0f0",
                      borderRadius: "6px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#52c41a",
                    }}
                  >
                    ${calculateSalePrice().toFixed(2)}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Product Variants */}
            <Card
              title={
                <Space>
                  <TagsOutlined />
                  <span>Product Variants</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Row gutter={[16, 24]}>
                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Available Sizes</label>
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Select available sizes"
                    value={product.variants.sizes}
                    onChange={(sizes) => handleNestedChange("variants", "sizes", sizes)}
                    style={{ width: "100%" }}
                    options={sizeOptions.map((size) => ({
                      label: size,
                      value: size,
                    }))}
                  />
                </Col>

                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Available Colors</label>
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Select available colors"
                    value={product.variants.colors}
                    onChange={(colors) => handleNestedChange("variants", "colors", colors)}
                    style={{ width: "100%" }}
                  >
                    {colorOptions.map((color) => (
                      <Option key={color.value} value={color.value}>
                        <Space>
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              backgroundColor: color.hex,
                              border: "1px solid #d9d9d9",
                              borderRadius: 2,
                            }}
                          />
                          {color.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Card>

            {/* Enhanced Inventory Management */}
            <Card
              title={
                <Space>
                  <ShoppingOutlined />
                  <span>Inventory Management</span>
                  <Badge count={product.inventory.length} style={{ backgroundColor: "#1890ff" }} />
                  {lowStockItems.length > 0 && (
                    <Badge count={lowStockItems.length} style={{ backgroundColor: "#faad14" }} />
                  )}
                </Space>
              }
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openInventoryModal()} size="large">
                  Add Inventory Item
                </Button>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* Enhanced Stock Overview with Low Stock */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: "center", background: "#e6f7ff" }}>
                    <Statistic
                      title="Total Stock"
                      value={product.stock}
                      valueStyle={{ color: "#1890ff", fontSize: "24px" }}
                      suffix="units"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: "center", background: "#f6ffed" }}>
                    <Statistic
                      title="Well Stocked"
                      value={availableItems.length}
                      valueStyle={{ color: "#52c41a", fontSize: "24px" }}
                      suffix="items"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: "center", background: "#fff7e6" }}>
                    <Statistic
                      title="Low Stock"
                      value={lowStockItems.length}
                      valueStyle={{ color: "#faad14", fontSize: "24px" }}
                      suffix="items"
                      prefix={<WarningOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ textAlign: "center", background: "#fff2f0" }}>
                    <Statistic
                      title="Out of Stock"
                      value={outOfStockItems.length}
                      valueStyle={{ color: "#ff4d4f", fontSize: "24px" }}
                      suffix="items"
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Enhanced Stock Level Progress */}
              <div style={{ marginBottom: 16 }}>
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Text strong>Stock Level: </Text>
                  <Text style={{ color: stockStatus.color, fontWeight: "bold" }}>
                    {stockStatus.text} ({product.stock} units)
                  </Text>
                </Space>
                <Progress
                  percent={Math.min((product.stock / 100) * 100, 100)}
                  status={stockStatus.status}
                  strokeColor={stockStatus.color}
                  showInfo={false}
                  style={{ marginTop: 8 }}
                />
                {lowStockItems.length > 0 && (
                  <Text type="warning" style={{ fontSize: "12px" }}>
                    ⚠️ {lowStockItems.length} items need immediate restocking (≤{STOCK_THRESHOLDS.ITEM_LOW_STOCK} units)
                  </Text>
                )}
              </div>

              <Table
                columns={inventoryColumns}
                dataSource={product.inventory}
                rowKey={(record) => `${record.size}-${record.color}`}
                pagination={false}
                scroll={{ x: 800 }}
                locale={{ emptyText: "No inventory items added yet. Click 'Add Inventory Item' to get started." }}
                size="middle"
                rowClassName={(record) => {
                  if (record.quantity === 0) return "out-of-stock-row"
                  if (record.quantity <= STOCK_THRESHOLDS.ITEM_LOW_STOCK) return "low-stock-row"
                  return ""
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Row gutter={[16, 24]}>
                <Col span={24}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Tags</label>
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Add tags (press Enter to add)"
                    value={product.tags}
                    onChange={(tags) => handleChange("tags", tags)}
                    style={{ width: "100%" }}
                  />
                </Col>

                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>Product Status</label>
                    <Switch
                      checked={product.status}
                      onChange={(checked) => handleChange("status", checked)}
                      checkedChildren="Active"
                      unCheckedChildren="Inactive"
                    />
                  </Space>
                </Col>

                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>New Product</label>
                    <Switch
                      checked={product.isNew}
                      onChange={(checked) => handleChange("isNew", checked)}
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
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {product.images && product.images.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      maxHeight: "200px",
                      objectFit: "cover",
                    }}
                    src={product.images[0] || "/placeholder.svg"}
                    alt="Product Preview"
                  />
                </div>
              )}

              <Upload.Dragger
                fileList={fileList}
                onChange={handleUploadChange}
                listType="picture"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                showUploadList={{ showRemoveIcon: true }}
                beforeUpload={() => false}
                style={{
                  borderRadius: 8,
                  border: "2px dashed #d9d9d9",
                  background: "#fafafa",
                }}
              >
                <p className="ant-upload-drag-icon">
                  <PlusOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 16, margin: "8px 0" }}>
                  <strong>Drop images here</strong> or click to browse
                </p>
                <p className="ant-upload-hint" style={{ color: "#999", fontSize: 14 }}>
                  Support: JPG, PNG, WEBP (Max 5MB each)
                </p>
              </Upload.Dragger>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            marginTop: 24,
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Space size="large">
            {isAddNew ? (
              <Button type="primary" size="large" onClick={handleCreate} style={{ minWidth: 120, height: 48 }}>
                Create Product
              </Button>
            ) : (
              <>
                <Button type="primary" size="large" onClick={handleUpdate} style={{ minWidth: 120, height: 48 }}>
                  Update Product
                </Button>
                <Button
                  danger
                  size="large"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  style={{ minWidth: 120, height: 48 }}
                >
                  Delete
                </Button>
              </>
            )}
            <Button size="large" onClick={handleCancel} style={{ minWidth: 120, height: 48 }}>
              Cancel
            </Button>
          </Space>
        </Card>

        {/* Enhanced Inventory Modal */}
        <Modal
          title={
            <Space>
              <ShoppingOutlined />
              {editingInventoryItem ? "Edit Inventory Item" : "Add New Inventory Item"}
            </Space>
          }
          open={inventoryModalVisible}
          onOk={handleInventorySubmit}
          onCancel={() => {
            setInventoryModalVisible(false)
            setEditingInventoryItem(null)
            inventoryForm.resetFields()
          }}
          width={600}
          okText={editingInventoryItem ? "Update Item" : "Add Item"}
        >
          <Form form={inventoryForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="size" label="Size" rules={[{ required: true, message: "Please select a size!" }]}>
                  <Select placeholder="Select size" size="large">
                    {sizeOptions.map((size) => (
                      <Option key={size} value={size}>
                        Size {size}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="color" label="Color" rules={[{ required: true, message: "Please select a color!" }]}>
                  <Select placeholder="Select color" size="large">
                    {colorOptions.map((color) => (
                      <Option key={color.value} value={color.value}>
                        <Space>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              backgroundColor: color.hex,
                              border: "1px solid #d9d9d9",
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
              rules={[{ required: true, message: "Please enter quantity!" }]}
              extra={`This will be added to the total stock automatically. Low stock threshold: ≤${STOCK_THRESHOLDS.ITEM_LOW_STOCK} units`}
            >
              <InputNumber
                placeholder="Enter quantity"
                min={0}
                style={{ width: "100%" }}
                size="large"
                formatter={(value) => `${value} units`}
                parser={(value) => value.replace(" units", "")}
              />
            </Form.Item>
            <Form.Item name="images" label="Images (Optional)">
              <Select mode="tags" placeholder="Add image URLs" style={{ width: "100%" }} size="large" />
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
  )
}
