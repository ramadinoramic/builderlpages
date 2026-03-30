"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type BuilderComponent, type BuilderPageData, type BuilderComponentType, getComponentDefinition } from "./builder-types";
import PageRenderer from "./PageRenderer";
import { GripVertical, Trash2 } from "lucide-react";

interface BuilderCanvasProps {
  pageData: BuilderPageData;
  selectedId: string | null;
  onSelectComponent: (id: string | null) => void;
  onReorder: (activeId: string, overId: string) => void;
  onDeleteComponent: (id: string) => void;
  onDropNewComponent: (type: BuilderComponentType, index: number) => void;
}

export default function BuilderCanvas({
  pageData,
  selectedId,
  onSelectComponent,
  onReorder,
  onDeleteComponent,
  onDropNewComponent,
}: BuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(active.id as string, over.id as string);
  }

  return (
    <div
      style={{
        flex: 1,
        background: "#0a0a12",
        borderRadius: 12,
        overflow: "auto",
        position: "relative",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelectComponent(null);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("builder-component-type")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        const type = e.dataTransfer.getData("builder-component-type") as BuilderComponentType;
        if (!type) return;
        e.preventDefault();
        onDropNewComponent(type, pageData.components.length);
      }}
    >
      {/* Phone frame preview */}
      <div style={{
        maxWidth: pageData.globalStyles.maxWidth + 40,
        margin: "20px auto",
        background: pageData.globalStyles.backgroundColor,
        borderRadius: 16,
        border: "2px solid #2a2a40",
        overflow: "hidden",
        minHeight: 500,
        position: "relative",
      }}>
        {pageData.components.length === 0 && (
          <div style={{
            padding: 48,
            textAlign: "center",
            color: "#666688",
            border: "2px dashed #2a2a40",
            borderRadius: 12,
            margin: 20,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
            <p style={{ fontSize: 14, marginBottom: 4 }}>Drag components here</p>
            <p style={{ fontSize: 12, color: "#444" }}>or click them in the left panel to add</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pageData.components.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {pageData.components.map((component) => (
              <SortableComponent
                key={component.id}
                component={component}
                isSelected={selectedId === component.id}
                onSelect={() => onSelectComponent(component.id)}
                onDelete={() => onDeleteComponent(component.id)}
                pageData={pageData}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableComponent({
  component,
  isSelected,
  onSelect,
  onDelete,
  pageData,
}: {
  component: BuilderComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  pageData: BuilderPageData;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const def = getComponentDefinition(component.type);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: "relative",
        outline: isSelected ? "2px solid #00ca6b" : "2px solid transparent",
        outlineOffset: -2,
        borderRadius: 4,
        cursor: "pointer",
        transition: "outline 0.15s",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Hover/selected toolbar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 24,
          background: isSelected ? "rgba(0,202,107,0.15)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
          zIndex: 10,
          opacity: isSelected ? 1 : 0,
          transition: "opacity 0.15s",
          pointerEvents: isSelected ? "auto" : "none",
        }}
        className="component-toolbar"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div {...attributes} {...listeners} style={{ cursor: "grab", display: "flex", alignItems: "center", color: "#00ca6b" }}>
            <GripVertical size={14} />
          </div>
          <span style={{ fontSize: 10, color: "#00ca6b", fontWeight: 600 }}>
            {def?.icon} {def?.label}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: "rgba(255,107,107,0.2)",
            border: "none",
            color: "#ff6b6b",
            cursor: "pointer",
            borderRadius: 3,
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Render the actual component */}
      <div style={{ pointerEvents: "none" }}>
        <PageRenderer
          pageData={{
            ...pageData,
            components: [component],
          }}
          isPreview
        />
      </div>
    </div>
  );
}
