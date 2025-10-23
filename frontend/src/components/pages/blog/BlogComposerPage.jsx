import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Switch, Button, Typography, message, Upload, Image } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import blogService from '../../../services/blogService';
import { Editor } from '@tinymce/tinymce-react';
import axiosInstance from '../../../services/axiosInstance';

const { Title } = Typography;

const BlogComposerPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    category: '',
    tags: [],
    isFeatured: false,
    thumbnail: '',
    banner: '',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const loadBlog = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);
      const res = await blogService.get(id);
      const blog = res.data;
      setForm({
        title: blog.title || '',
        content: blog.content || '',
        summary: blog.summary || '',
        category: blog.category || '',
        tags: blog.tags || [],
        isFeatured: blog.isFeatured || false,
        thumbnail: blog.thumbnail || '',
        banner: blog.banner || '',
        status: blog.status || 'draft',
      });
    } catch (e) {
      message.error('Failed to load blog post');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlog();
  }, [id]);

  const handleUpload = async (file, type) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axiosInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      handleChange(type, response.data.url);
      message.success('Image uploaded successfully');
    } catch (error) {
      message.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (publish = false) => {
    try {
      setSaving(true);
      const payload = { ...form, status: publish ? 'published' : 'draft' };
      if (!payload.title?.trim()) return message.warning('Title is required');
      if (!payload.content?.trim()) return message.warning('Content is required');

      if (isEdit) {
        await blogService.update(id, payload);
        message.success(publish ? 'Post updated and published' : 'Post updated');
      } else {
        await blogService.create(payload);
        message.success(publish ? 'Post published' : 'Post saved as draft');
      }
      navigate('/blog');
    } catch (e) {
      message.error(e.response?.data?.message || e.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 820, margin: '24px auto', padding: '0 16px' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 820, margin: '24px auto', padding: '0 16px' }}>
      <Card>
        <Title level={3}>{isEdit ? 'Edit Post' : 'Create Post'}</Title>
        <Input
          placeholder="Title"
          size="large"
          value={form.title}
          onChange={e => handleChange('title', e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <Editor
          value={form.content}
          onEditorChange={newValue => handleChange('content', newValue)}
          init={{
            height: 400,
            menubar: false,
            plugins: [
              'advlist',
              'autolink',
              'lists',
              'link',
              'image',
              'charmap',
              'preview',
              'anchor',
              'searchreplace',
              'visualblocks',
              'code',
              'fullscreen',
              'insertdatetime',
              'media',
              'table',
              'help',
              'wordcount',
            ],
            toolbar:
              'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code | help',
            content_style:
              'body { font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:14px }',
            // Disable API key requirement for development
            branding: false,
            promotion: false,
          }}
        />

        <Input
          placeholder="Summary (optional)"
          value={form.summary}
          onChange={e => handleChange('summary', e.target.value)}
          style={{ margin: '12px 0' }}
        />
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}>Thumbnail:</div>
          {form.thumbnail ? (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
              <Image
                src={form.thumbnail}
                alt="Thumbnail"
                style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleChange('thumbnail', '')}
                style={{ position: 'absolute', top: 4, right: 4 }}
              />
            </div>
          ) : (
            <Upload
              beforeUpload={file => {
                handleUpload(file, 'thumbnail');
                return false;
              }}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Upload Thumbnail
              </Button>
            </Upload>
          )}
          <Input
            placeholder="Or paste image URL"
            value={form.thumbnail}
            onChange={e => handleChange('thumbnail', e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}>Banner (optional):</div>
          {form.banner ? (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
              <Image
                src={form.banner}
                alt="Banner"
                style={{ width: 300, height: 150, objectFit: 'cover', borderRadius: 8 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleChange('banner', '')}
                style={{ position: 'absolute', top: 4, right: 4 }}
              />
            </div>
          ) : (
            <Upload
              beforeUpload={file => {
                handleUpload(file, 'banner');
                return false;
              }}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Upload Banner
              </Button>
            </Upload>
          )}
          <Input
            placeholder="Or paste banner URL"
            value={form.banner}
            onChange={e => handleChange('banner', e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
        <Input
          placeholder="Category"
          value={form.category}
          onChange={e => handleChange('category', e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Select
          mode="tags"
          placeholder="Tags"
          value={form.tags}
          onChange={value => handleChange('tags', value)}
          style={{ width: '100%', marginBottom: 12 }}
        />
        <div style={{ marginBottom: 16 }}>
          Featured:{' '}
          <Switch checked={form.isFeatured} onChange={v => handleChange('isFeatured', v)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => navigate('/blog')}>Cancel</Button>
          <Button loading={saving} onClick={() => submit(false)}>
            Save Draft
          </Button>
          <Button type="primary" loading={saving} onClick={() => submit(true)}>
            Publish
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BlogComposerPage;
