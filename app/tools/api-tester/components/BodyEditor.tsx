'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RequestBody, BodyType, KeyValue } from '../types';
import { KeyValueEditor } from './KeyValueEditor';

interface BodyEditorProps {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
}

export function BodyEditor({ body, onChange }: BodyEditorProps) {
  const handleTypeChange = (type: BodyType) => {
    const newBody: RequestBody = { type, content: body.content };
    if (type === 'form-data' || type === 'x-www-form-urlencoded') {
      newBody.formData = body.formData || [];
    }
    onChange(newBody);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Body Type</Label>
        <Select value={body.type} onValueChange={(v) => handleTypeChange(v as BodyType)}>
          <SelectTrigger className="h-8 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="form-data">Form Data</SelectItem>
            <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
            <SelectItem value="raw">Raw</SelectItem>
            <SelectItem value="graphql">GraphQL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {body.type === 'none' && (
        <p className="text-sm text-muted-foreground">No body for this request</p>
      )}

      {(body.type === 'json' || body.type === 'raw' || body.type === 'graphql') && (
        <Textarea
          value={body.content}
          onChange={(e) => onChange({ ...body, content: e.target.value })}
          placeholder={
            body.type === 'json'
              ? '{\n  "key": "value"\n}'
              : body.type === 'graphql'
              ? 'query {\n  \n}'
              : 'Raw body content...'
          }
          className="min-h-[200px] font-mono text-sm"
        />
      )}

      {(body.type === 'form-data' || body.type === 'x-www-form-urlencoded') && (
        <KeyValueEditor
          items={body.formData || []}
          onChange={(formData) => onChange({ ...body, formData })}
          keyPlaceholder="Field name"
          valuePlaceholder="Field value"
        />
      )}
    </div>
  );
}
