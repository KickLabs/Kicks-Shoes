/**
 * @fileoverview Create LiveStream Component
 * @created 2025-01-02
 * @file CreateLiveStream.jsx
 * @description Form for creating new livestream sessions
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Switch,
  InputNumber,
  message,
  Typography,
  Space,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import livestreamService from '../../../services/livestreamService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateLiveStream = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Setup video element when stream is available
  useEffect(() => {
    if (stream && videoRef.current && cameraPreview) {
      console.log('Setting up video element with stream');
      videoRef.current.srcObject = stream;

      // Force play after a short delay
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current
            .play()
            .then(() => console.log('Video playing from useEffect'))
            .catch(e => console.error('Play error from useEffect:', e));
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [stream, cameraPreview]);

  const handleSubmit = async values => {
    setLoading(true);
    try {
      const streamData = {
        title: values.title,
        description: values.description,
        scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
        settings: {
          maxViewers: values.maxViewers || 50,
          allowChat: values.allowChat !== false,
          isPublic: values.isPublic !== false,
          recordStream: values.recordStream || false,
        },
      };

      console.log('Creating livestream with data:', streamData);
      const response = await livestreamService.createLiveStream(streamData);
      console.log('Livestream created:', response);

      message.success('Livestream created successfully!');

      // Stop camera preview if running
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Navigate to the host page
      navigate(`/shop/livestream/host/${response.data.liveStream.roomId}`);
    } catch (error) {
      console.error('Error creating livestream:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to create livestream';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startCameraPreview = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Requesting camera access...');
      let mediaStream;

      // Try with specific constraints first
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: true,
        });
      } catch (constraintError) {
        console.log('Specific constraints failed, trying basic constraints:', constraintError);
        // Fallback to basic constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      console.log('Camera access granted, stream:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      console.log('Audio tracks:', mediaStream.getAudioTracks());

      setStream(mediaStream);
      setCameraPreview(true);

      // Wait for video element to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Add event listeners for debugging
        videoRef.current.onloadedmetadata = () => {
          console.log(
            'Video metadata loaded, dimensions:',
            videoRef.current.videoWidth,
            'x',
            videoRef.current.videoHeight
          );
          // Force play the video
          videoRef.current
            .play()
            .then(() => console.log('Video playing successfully'))
            .catch(e => console.error('Play error:', e));
        };

        videoRef.current.onloadeddata = () => {
          console.log('Video data loaded');
        };

        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };

        videoRef.current.onplaying = () => {
          console.log('Video is playing');
        };

        videoRef.current.onerror = e => {
          console.error('Video element error:', e);
        };

        // Try to play immediately if possible
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            videoRef.current
              .play()
              .then(() => console.log('Manual play successful'))
              .catch(e => console.log('Manual play failed:', e));
          }
        }, 1000);
      }

      message.success('Camera preview started');
    } catch (error) {
      console.error('Error accessing camera:', error);

      let errorMessage = 'Failed to access camera';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.';
      }

      message.error(errorMessage);
    }
  };

  const stopCameraPreview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraPreview(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    message.info('Camera preview stopped');
  };

  const disabledDate = current => {
    // Disable dates before today
    return current && current < dayjs().startOf('day');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <VideoCameraOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <Title level={2} style={{ marginTop: '16px' }}>
            Create New Livestream
          </Title>
          <Text type="secondary">
            Set up your livestream and start broadcasting to your audience
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            maxViewers: 50,
            allowChat: true,
            isPublic: true,
            recordStream: false,
          }}
        >
          {/* Basic Information */}
          <Title level={4}>Basic Information</Title>

          <Form.Item
            name="title"
            label="Stream Title"
            rules={[
              { required: true, message: 'Please enter a stream title' },
              { min: 3, message: 'Title must be at least 3 characters long' },
              { max: 200, message: 'Title cannot exceed 200 characters' },
            ]}
          >
            <Input placeholder="Enter an engaging title for your livestream" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 1000, message: 'Description cannot exceed 1000 characters' }]}
          >
            <TextArea rows={4} placeholder="Describe what your livestream will be about..." />
          </Form.Item>

          <Form.Item
            name="scheduledAt"
            label="Schedule Time (Optional)"
            help="Leave empty to start streaming immediately"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="Select date and time"
              disabledDate={disabledDate}
              size="large"
            />
          </Form.Item>

          <Divider />

          {/* Camera Preview */}
          <Title level={4}>Camera Preview</Title>

          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            {!cameraPreview ? (
              <div>
                <Alert
                  message="Test your camera and microphone before going live"
                  description="Make sure to allow camera and microphone permissions when prompted"
                  type="info"
                  style={{ marginBottom: '16px' }}
                />
                <Space>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={startCameraPreview}
                    size="large"
                  >
                    Start Camera Preview
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const videoDevices = devices.filter(device => device.kind === 'videoinput');
                        const audioDevices = devices.filter(device => device.kind === 'audioinput');
                        console.log('Available cameras:', videoDevices);
                        console.log('Available microphones:', audioDevices);
                        message.info(
                          `Found ${videoDevices.length} camera(s) and ${audioDevices.length} microphone(s)`
                        );
                      } catch (error) {
                        console.error('Error checking devices:', error);
                        message.error('Failed to check available devices');
                      }
                    }}
                    size="large"
                  >
                    Check Devices
                  </Button>
                </Space>
              </div>
            ) : (
              <div>
                <video
                  ref={videoRef}
                  autoPlay
                  muted={false}
                  playsInline
                  controls={false}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '300px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    backgroundColor: '#000',
                    objectFit: 'cover',
                    border: '2px solid #1890ff',
                  }}
                  onCanPlay={() => {
                    console.log('Video can play');
                    if (videoRef.current) {
                      console.log('Video ready state:', videoRef.current.readyState);
                      console.log(
                        'Video dimensions:',
                        videoRef.current.videoWidth,
                        'x',
                        videoRef.current.videoHeight
                      );
                    }
                  }}
                  onPlay={() => console.log('Video started playing')}
                  onPause={() => console.log('Video paused')}
                  onWaiting={() => console.log('Video waiting')}
                  onStalled={() => console.log('Video stalled')}
                  onError={e => console.error('Video error:', e)}
                />
                <div>
                  <Space>
                    <Button danger icon={<StopOutlined />} onClick={stopCameraPreview} size="large">
                      Stop Preview
                    </Button>
                    <Button
                      onClick={() => {
                        if (videoRef.current && stream) {
                          console.log('Force refreshing video...');
                          console.log('Stream active:', stream.active);
                          console.log(
                            'Video tracks:',
                            stream.getVideoTracks().map(t => ({
                              enabled: t.enabled,
                              readyState: t.readyState,
                              muted: t.muted,
                            }))
                          );

                          // Re-assign stream
                          videoRef.current.srcObject = null;
                          setTimeout(() => {
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                              videoRef.current
                                .play()
                                .then(() => console.log('Force refresh successful'))
                                .catch(e => console.error('Force refresh failed:', e));
                            }
                          }, 100);
                        }
                      }}
                      size="large"
                    >
                      Refresh Video
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Stream Settings */}
          <Title level={4}>Stream Settings</Title>

          <Form.Item
            name="maxViewers"
            label="Maximum Viewers"
            help="Set the maximum number of concurrent viewers (1-100)"
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item name="allowChat" label="Enable Chat" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="isPublic"
            label="Public Stream"
            help="Public streams appear in the discover section"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="recordStream"
            label="Record Stream"
            help="Save the stream for later viewing (coming soon)"
            valuePropName="checked"
          >
            <Switch disabled />
          </Form.Item>

          <Divider />

          {/* Actions */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
              <Button size="large" onClick={() => navigate('/shop/dashboard')}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<PlusOutlined />}
              >
                Create Livestream
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateLiveStream;
