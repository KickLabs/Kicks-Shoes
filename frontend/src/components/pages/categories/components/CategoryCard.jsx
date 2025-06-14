import { Card, Button, Tag, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, TagsOutlined } from "@ant-design/icons";

const CategoryCard = ({ category, onDelete }) => {
  const handleEdit = () => {
    window.location.href = `/dashboard/categories/${category._id}`;
  };

  const handleDelete = () => {
    onDelete(category._id);
  };

  return (
    <Card
      hoverable
      className="category-card"
      actions={[
        <Tooltip key="edit" title="Edit Category">
          <Button type="text" icon={<EditOutlined />} onClick={handleEdit} />
        </Tooltip>,
        <Tooltip key="delete" title="Delete Category">
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            danger
          />
        </Tooltip>,
      ]}>
      <div className="category-header">
        <div className="category-icon">
          <TagsOutlined style={{ fontSize: 18, color: "#1890ff" }} />
        </div>
        <div className="category-info">
          <h3 className="category-name">{category.name}</h3>
        </div>
      </div>

      {category.description && (
        <div className="category-description">
          <p>{category.description}</p>
        </div>
      )}

      <div className="category-meta">
        <Tag color="blue">
          Created: {new Date(category.createdAt).toLocaleDateString()}
        </Tag>
        {category.updatedAt !== category.createdAt && (
          <Tag color="green">
            Updated: {new Date(category.updatedAt).toLocaleDateString()}
          </Tag>
        )}
      </div>
    </Card>
  );
};

export default CategoryCard;
