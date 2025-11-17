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

// Single pair of operator/value/format/type
export type BlockDataPair = {
  operator: string[];
  value: Record<string, unknown> | string[] | null;
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
  operator: string[][] | null;
  value: Record<string, unknown>[] | Record<string, NestedFieldItem> | null;
  format?: string[];
  type?: string[];
  source?: string;
  sublabels?: string[];
};

export const NODE_TYPES = {
  trigger: { label: 'Trigger', color: '#3b82f6', bgColor: '#dbeafe', icon: '▶' },
  action: { label: 'Action', color: '#8b5cf6', bgColor: '#ede9fe', icon: '⚙' },
  condition: { label: 'Condition', color: '#ec4899', bgColor: '#fce7f3', icon: '◇' },
  delay: { label: 'Delay', color: '#f59e0b', bgColor: '#fef3c7', icon: '⏱' },
  end: { label: 'End', color: '#10b981', bgColor: '#d1fae5', icon: '✓' },
};

export const block_data: Record<string, BlockDataItem> = {
  "first_message": {
    label: 'First Message',
    enable: ['trigger'],
    operator: null,
    value: null
  },
  "incoming_Message": {
    label: 'Incoming Message',
    enable: ['trigger'],
    operator: null,
    value: null
  },
  "message_filter": {
    label: 'Message Filter',
    enable: ['condition'],
    operator: null,
    value: {
      text: { label: 'Text', operator: ['is', 'is not', 'contains'], value: null, format: 'input', type: 'text' },
      type: { label: 'Type', operator: ['is', 'is not'], value: ['Text', 'Voice', 'Image'], format: 'static', type: 'select' },
    },
  },
  "message_count": {
    label: 'Message Count',
    enable: ['condition'],
    // Example with multiple pairs: first pair for count, second pair for time range
    operator: [
      ['is', 'is gte', 'is lte'],  // operators for first pair
    ],
    value: [
      {},  // value for first pair (count)
    ],
    format: ['input'],  // both are input fields
    type: ['number'],    // first is number, second is date
  },
  "conversation_started": {
    label: 'Conversation Started',
    enable: ['condition'],
    operator: [['is', 'is gte', 'is lte']],
    value: [{}],
    format: ['input'],
    type: ['date'],
  },
  "platform": {
    label: 'Platform',
    enable: ['condition'],
    // Example with multiple pairs: platform type and version
    operator: [
      ['is', 'is not'],           // operators for platform type
    ],
    value: [
      { options: ['WhatsApp', 'WACA'] },  // options for platform
    ],
    format: ['static'],  // first is static select, second is input
    type: ['select'],     // first is select, second is text
  },
  "integrated_phone_number": {
    label: 'Integrated Phone Number',
    enable: ['condition'],
    operator: [['is', 'is not']],
    value: [{}],
    format: ['calling_api'],
    type: ['select'],
    source: '/workflow/integrated-phones',
  },
  "customer_phone_number": {
    label: 'Customer Phone Number',
    enable: ['condition'],
    operator: [['is', 'is not']],
    value: [{}],
    format: ['input'],
    type: ['text'],
  },
  "send_message": {
    label: 'Send Message',
    enable: ['action'],
    operator: [['is'], ['is']],
    value: [{}],
    format: ['input', 'input'],
    type: ['textarea', 'multifile'],
    sublabels: ['Message', 'Attachment']
  },
  "ai_reply": {
    label: 'AI Auto Reply',
    enable: ['action'],
    operator: [['is']],
    value: [{}],
    format: ['auto'],
    type: [''],
  },
  "send_email": {
    label: 'Send Email',
    enable: ['action'],
    operator: [['is'], ['is'], ['is']],
    value: [{}],
    format: ['input','input', 'input'],
    type: ['text','textarea', 'multifile'],
    sublabels: ['To','Message', 'Attachment']
  },
  "book_meeting": {
    label: 'Book Meeting',
    enable: ['action'],
    operator: [['is']],
    value: [{}],
    format: ['input'],
    type: ['text'],
    sublabels: ['Calendar Link']
  },
  "delay": {
    label: 'Delay',
    enable: ['delay'],
    operator: [['is']],
    value: [{}],
    format: ['input'],
    type: ['number'],
  },
};