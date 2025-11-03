// Reusable constants and types for the Workflow editor

export type BlockFunctionInfo = {
  key: string;
  type: string;
  operator: string[] | null;
  subKey: string | null;
};

// Nested field definition (for complex blocks like message_filter)
export type NestedFieldItem = {
  label: string;
  operator: string[];
  value: string[] | null;
  format: string;
  type: string;
  source?: string;
};

// Value types that can be used in block data
export type BlockValue = string | number | string[] | null | Record<string, NestedFieldItem>;

// Settings value types (what can be stored in settings)
export type SettingsValue = string | number | null | undefined;

export type BlockInstance = {
  key: string;
  item: BlockDataItem;
  settings?: {
    value?: SettingsValue;
    operator?: SettingsValue;
    function_info?: BlockFunctionInfo;
    [key: string]: SettingsValue | BlockFunctionInfo | undefined;
  };
};

export type BlockDataItem = {
  label: string;
  enable: string[];
  operator: string[] | null;
  value: BlockValue;
  format?: string;
  type?: string;
  source?: string;
};

export const NODE_TYPES = {
  trigger: { label: 'Trigger', color: '#3b82f6', bgColor: '#dbeafe', icon: '▶' },
  action: { label: 'Action', color: '#8b5cf6', bgColor: '#ede9fe', icon: '⚙' },
  condition: { label: 'Condition', color: '#ec4899', bgColor: '#fce7f3', icon: '◇' },
  delay: { label: 'Delay', color: '#f59e0b', bgColor: '#fef3c7', icon: '⏱' },
  end: { label: 'End', color: '#10b981', bgColor: '#d1fae5', icon: '✓' },
};

export const block_data: Record<string, BlockDataItem> = {
  "first_message": { label: 'First Message', enable: ['trigger'], operator: null, value: null },
  "incoming_Message": { label: 'Incoming Message', enable: ['trigger'], operator: null, value: null },
  "message_filter": {
    label: 'Message Filter',
    enable: ['trigger', 'condition'],
    operator: null,
    value: {
      text: { label: 'Text', operator: ['is', 'is not', 'contains'], value: null, format: 'input', type: 'text' },
      type: { label: 'Type', operator: ['is', 'is not'], value: ['Text', 'Voice', 'Image'], format: 'static', type: 'select' },
    },
  },
  "message_count": {
    label: 'Message Count',
    enable: ['condition'],
    operator: ['is', 'is gte', 'is lte'],
    value: null,
    format: 'input',
    type: 'number',
  },
  "conversation_started": {
    label: 'Conversation Started',
    enable: ['condition'],
    operator: ['is', 'is gte', 'is lte'],
    value: null,
    format: 'input',
    type: 'date',
  },
  "platform": {
    label: 'Platform',
    enable: ['condition'],
    operator: ['is', 'is not'],
    value: ['WhatsApp'],
    format: 'static',
    type: 'select',
  },
  "integrated_phone_number": {
    label: 'Integrated Phone Number',
    enable: ['condition'],
    operator: ['is', 'is not'],
    value: null,
    format: 'calling_api',
    type: 'select',
    source: 'workflow/condition/integrated_phone_number',
  },
  "customer_phone_number": {
    label: 'Customer Phone Number',
    enable: ['condition'],
    operator: ['is', 'is not'],
    value: null,
    format: 'input',
    type: 'text',
  },
  "send_message": {
    label: 'Send Message',
    enable: ['action'],
    operator: ['is'],
    value: null,
    format: 'input',
    type: 'textarea',
  },
  "ai_reply": {
    label: 'AI Auto Reply',
    enable: ['action'],
    operator: ['is'],
    value: null,
    format: 'auto',
    type: '',
  },
  "send_email": {
    label: 'Send Email',
    enable: ['action'],
    operator: ['is'],
    value: null,
    format: 'input',
    type: 'text',
  },
  "delay": {
    label: 'Delay',
    enable: ['delay'],
    operator: ['is'],
    value: null,
    format: 'input',
    type: 'number',
  },
};