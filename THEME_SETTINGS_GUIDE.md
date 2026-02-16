# Theme Settings System - Complete Guide

## Overview

The `theme_settings` table is a comprehensive configuration system that stores all customization options for your multi-channel customer service platform. It controls:

- **Visual Appearance**: Colors, logos, fonts, styling
- **Agent Interface**: Dashboard layout, tools, notifications
- **Customer Experience**: Chat widget, forms, localization
- **System Behavior**: Features, business hours, automation, limits
- **Integrations**: WhatsApp, Telegram, email, analytics, CRM

---

## Table Structure

### Basic Information
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to companies table (UNIQUE) |
| `created_at` | Timestamp | When settings were created |
| `updated_at` | Timestamp | Auto-updated on changes |

### Visual Customization - Colors
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `primary_color` | TEXT | #3b82f6 | Main brand color |
| `secondary_color` | TEXT | #1e40af | Secondary brand color |
| `accent_color` | TEXT | #60a5fa | Accent/highlight color |
| `background_color` | TEXT | #ffffff | Main background color |
| `text_color` | TEXT | #1e293b | Default text color |
| `incoming_message_color` | TEXT | #f1f5f9 | Customer message background |
| `outgoing_message_color` | TEXT | #3b82f6 | Agent message background |
| `incoming_text_color` | TEXT | #1e293b | Customer message text |
| `outgoing_text_color` | TEXT | #ffffff | Agent message text |

### Visual Customization - Branding
| Column | Type | Description |
|--------|------|-------------|
| `display_name` | TEXT | Company display name |
| `logo_primary_url` | TEXT | Main logo (dashboard header) |
| `logo_favicon_url` | TEXT | Browser favicon (16x16 or 32x32px) |
| `logo_email_url` | TEXT | Logo for email templates |
| `logo_chat_widget_url` | TEXT | Logo for customer chat widget |

### Visual Customization - Typography & Style
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `font_family_primary` | TEXT | Inter, system-ui | Primary font |
| `font_family_secondary` | TEXT | Inter, system-ui | Secondary font |
| `custom_css` | TEXT | NULL | Custom CSS rules |
| `theme_mode` | TEXT | light | light, dark, auto, custom |
| `border_radius` | TEXT | 8px | Global border radius |
| `shadow_style` | TEXT | medium | none, subtle, medium, strong |

### Complex Configurations (JSONB)
| Column | Type | Description |
|--------|------|-------------|
| `agent_interface_config` | JSONB | Dashboard layout, tools, notifications |
| `customer_display_config` | JSONB | Chat widget, forms, localization |
| `system_config` | JSONB | Features, business hours, automation |
| `integration_config` | JSONB | WhatsApp, Telegram, email, analytics, CRM |

### Versioning & History
| Column | Type | Description |
|--------|------|-------------|
| `settings_version` | INTEGER | Auto-incremented on updates |
| `last_modified_by` | UUID | User who made last change |
| `change_history` | JSONB | Last 50 changes with timestamps |

---

## JSONB Configuration Structures

### 1. Agent Interface Config

```typescript
{
  "layout": "comfortable",              // compact | comfortable | spacious
  "sidebar_position": "left",           // left | right
  "default_view": "list",               // list | grid | kanban
  "enabled_modules": [
    "contacts",
    "messages",
    "departments",
    "sectors",
    "tags"
  ],
  "quick_actions": [
    "transfer",
    "tag",
    "priority"
  ],
  "notification_preferences": {
    "sound_enabled": true,
    "desktop_notifications": true,
    "badge_count": true
  },
  "dashboard_widgets": [
    "recent_contacts",
    "active_chats",
    "statistics"
  ]
}
```

### 2. Customer Display Config

```typescript
{
  "chat_widget": {
    "position": "bottom-right",         // bottom-right | bottom-left
    "bubble_color": "#3b82f6",
    "bubble_icon": "chat",              // chat | help | support
    "greeting_message": "Olá! Como podemos ajudar?",
    "show_agent_avatars": true,
    "show_typing_indicator": true,
    "auto_open": false,
    "auto_open_delay": 3                // seconds
  },
  "form_settings": {
    "show_company_logo": true,
    "require_name": true,
    "require_email": false,
    "custom_fields": [
      {
        "name": "Department",
        "type": "select",
        "required": true
      }
    ]
  },
  "localization": {
    "default_language": "pt-BR",
    "available_languages": ["pt-BR", "en-US"],
    "timezone": "America/Sao_Paulo"
  }
}
```

### 3. System Config

```typescript
{
  "features": {
    "ai_enabled": true,
    "auto_translation": false,
    "file_attachments": true,
    "voice_messages": true,
    "video_calls": false,
    "screen_sharing": false
  },
  "business_hours": {
    "enabled": false,
    "timezone": "America/Sao_Paulo",
    "schedule": {
      "monday": {"open": "09:00", "close": "18:00"},
      "tuesday": {"open": "09:00", "close": "18:00"},
      "wednesday": {"open": "09:00", "close": "18:00"},
      "thursday": {"open": "09:00", "close": "18:00"},
      "friday": {"open": "09:00", "close": "18:00"}
    },
    "auto_reply_outside_hours": false,
    "outside_hours_message": "No momento estamos fora do horário."
  },
  "automation": {
    "auto_assignment": true,
    "round_robin": false,
    "smart_routing": false,
    "auto_close_inactive": false,
    "inactive_timeout_hours": 24
  },
  "limits": {
    "max_file_size_mb": 10,
    "max_attachments_per_message": 5,
    "max_active_chats_per_agent": 10
  }
}
```

### 4. Integration Config

```typescript
{
  "whatsapp": {
    "enabled": true,
    "webhook_url": ""
  },
  "telegram": {
    "enabled": false,
    "webhook_url": ""
  },
  "email": {
    "enabled": false,
    "smtp_host": "",
    "smtp_port": 587
  },
  "analytics": {
    "enabled": false,
    "tracking_id": ""
  },
  "crm": {
    "enabled": false,
    "provider": "",
    "sync_enabled": false
  }
}
```

---

## Usage Examples

### Example 1: Update Visual Settings (Colors & Logo)

```typescript
import { updateVisualSettings } from '@/lib/themeSettingsHelper';

await updateVisualSettings(companyId, {
  primary_color: '#10b981',
  incoming_message_color: '#f0fdf4',
  logo_primary_url: 'https://example.com/logo.png',
  display_name: 'My Company',
});
```

### Example 2: Enable/Disable Features

```typescript
import { updateSystemConfig } from '@/lib/themeSettingsHelper';

await updateSystemConfig(companyId, {
  features: {
    ai_enabled: true,
    video_calls: true,
    screen_sharing: true,
  }
});
```

### Example 3: Configure Business Hours

```typescript
import { updateSystemConfig } from '@/lib/themeSettingsHelper';

await updateSystemConfig(companyId, {
  business_hours: {
    enabled: true,
    timezone: 'America/Sao_Paulo',
    schedule: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '17:00' },
    },
    auto_reply_outside_hours: true,
    outside_hours_message: 'Retornaremos em breve!',
  }
});
```

### Example 4: Customize Chat Widget

```typescript
import { updateCustomerDisplayConfig } from '@/lib/themeSettingsHelper';

await updateCustomerDisplayConfig(companyId, {
  chat_widget: {
    position: 'bottom-left',
    bubble_color: '#10b981',
    greeting_message: 'Bem-vindo! Como posso ajudar?',
    auto_open: true,
    auto_open_delay: 5,
  }
});
```

### Example 5: Configure Agent Dashboard

```typescript
import { updateAgentInterfaceConfig } from '@/lib/themeSettingsHelper';

await updateAgentInterfaceConfig(companyId, {
  layout: 'compact',
  sidebar_position: 'right',
  enabled_modules: ['contacts', 'messages', 'analytics'],
  notification_preferences: {
    sound_enabled: false,
    desktop_notifications: true,
  }
});
```

### Example 6: Check if Feature is Enabled

```typescript
import { isFeatureEnabled } from '@/lib/themeSettingsHelper';

const aiEnabled = await isFeatureEnabled(companyId, 'ai_enabled');
if (aiEnabled) {
  // Show AI features
}
```

### Example 7: Get Complete Settings

```typescript
import { getThemeSettings } from '@/lib/themeSettingsHelper';

const settings = await getThemeSettings(companyId);
console.log(settings.primary_color);
console.log(settings.agent_interface_config.layout);
console.log(settings.system_config.features.ai_enabled);
```

---

## SQL Query Examples

### Get All Settings for a Company

```sql
SELECT * FROM theme_settings WHERE company_id = 'uuid-here';
```

### Update Only Message Colors

```sql
UPDATE theme_settings
SET
  incoming_message_color = '#e0f2fe',
  outgoing_message_color = '#0284c7'
WHERE company_id = 'uuid-here';
```

### Query JSONB Fields

```sql
-- Check if AI is enabled
SELECT company_id, system_config->'features'->>'ai_enabled' as ai_enabled
FROM theme_settings;

-- Get chat widget position
SELECT company_id, customer_display_config->'chat_widget'->>'position' as widget_position
FROM theme_settings;

-- Find companies with compact layout
SELECT company_id, display_name
FROM theme_settings
WHERE agent_interface_config->>'layout' = 'compact';
```

### Update Nested JSONB Values

```sql
-- Enable AI feature
UPDATE theme_settings
SET system_config = jsonb_set(
  system_config,
  '{features,ai_enabled}',
  'true'::jsonb
)
WHERE company_id = 'uuid-here';

-- Change chat widget color
UPDATE theme_settings
SET customer_display_config = jsonb_set(
  customer_display_config,
  '{chat_widget,bubble_color}',
  '"#10b981"'::jsonb
)
WHERE company_id = 'uuid-here';
```

---

## Benefits of This Design

### 1. **Performance**
- Frequently accessed simple values (colors, logos) are in direct columns
- GIN indexes on JSONB columns enable fast queries on nested values
- Single query loads all settings for a company

### 2. **Flexibility**
- Easy to add new configuration options to JSONB fields
- No schema changes needed for most new features
- Complex nested structures supported

### 3. **Version Control**
- Automatic version tracking on every update
- Change history stores last 50 modifications
- Easy to audit who changed what and when

### 4. **Scalability**
- Each company has exactly one settings record (UNIQUE constraint)
- Efficient querying with proper indexes
- JSONB queries are optimized by PostgreSQL

### 5. **Type Safety**
- Complete TypeScript interfaces provided
- Default values ensure consistency
- Helper functions prevent errors

---

## Best Practices

1. **Always use helper functions** instead of direct SQL when possible
2. **Validate JSON structure** before updating JSONB columns
3. **Use default values** from the types file for consistency
4. **Test complex queries** on JSONB fields before production
5. **Monitor settings_version** for audit trails
6. **Back up settings** before major changes using `exportThemeSettings()`

---

## Migration Notes

All existing data in the `companies` table (display_name, logo_url) is preserved and migrated. The system reads from `theme_settings` first, then falls back to `companies` for backward compatibility.

## Future Enhancements

Potential additions to consider:
- Custom branding per department/sector
- A/B testing configurations
- White-label settings
- Multi-language interface customization
- Advanced analytics configurations
- Custom notification rules
