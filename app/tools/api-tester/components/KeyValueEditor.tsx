'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { KeyValue, createKeyValue } from '../types';

interface KeyValueEditorProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  showDescription?: boolean;
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  showDescription = false,
}: KeyValueEditorProps) {
  const handleAdd = () => {
    onChange([...items, createKeyValue()]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: keyof KeyValue, value: string | boolean) => {
    onChange(
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.enabled}
            onCheckedChange={(checked) => handleUpdate(item.id, 'enabled', !!checked)}
          />
          <Input
            value={item.key}
            onChange={(e) => handleUpdate(item.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 h-8 text-sm"
          />
          <Input
            value={item.value}
            onChange={(e) => handleUpdate(item.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 h-8 text-sm"
          />
          {showDescription && (
            <Input
              value={item.description || ''}
              onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
              placeholder="Description"
              className="flex-1 h-8 text-sm"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleRemove(item.id)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add
      </Button>
    </div>
  );
}
