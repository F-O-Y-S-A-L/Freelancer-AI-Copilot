import { Response, NextFunction } from "express";
import { Template } from "../models/Template.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { isUsingMemoryDB, memoryStore } from "../config/db.js";

export async function getTemplates(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      const userTemplates = (memoryStore.templates || [])
        .filter((t) => t.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      res.json({ success: true, data: userTemplates });
      return;
    }

    const templates = await Template.find({ userId }).sort({ updatedAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
}

export async function createTemplate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;
    const { title, description, content, category } = req.body;

    const trimmedTitle = (title || "").trim();
    const templateContent = typeof content === "string" ? content : "";
    const trimmedCategory = (category || "Custom").trim();
    const trimmedDescription = (description || "").trim();

    if (isUsingMemoryDB()) {
      const templateId =
        "tpl_" + Date.now() + Math.random().toString(36).substr(2, 4);
      const newTemplate = {
        id: templateId,
        _id: templateId,
        userId,
        title: trimmedTitle,
        description: trimmedDescription,
        content: templateContent,
        category: trimmedCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (!memoryStore.templates) {
        memoryStore.templates = [];
      }
      memoryStore.templates.push(newTemplate);
      res.status(201).json({
        success: true,
        message: "Template created successfully",
        data: newTemplate,
      });
      return;
    }

    const template = await Template.create({
      userId,
      title: trimmedTitle,
      description: trimmedDescription,
      content: templateContent,
      category: trimmedCategory,
    });

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTemplateById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (isUsingMemoryDB()) {
      const template = (memoryStore.templates || []).find(
        (t) => (t.id === id || t._id === id) && t.userId === userId,
      );
      if (!template) {
        res.status(404).json({ success: false, error: "Template not found" });
        return;
      }
      res.json({ success: true, data: template });
      return;
    }

    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      res.status(404).json({ success: false, error: "Template not found" });
      return;
    }

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
}

export async function updateTemplate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, description, content, category } = req.body;

    if (isUsingMemoryDB()) {
      const index = (memoryStore.templates || []).findIndex(
        (t) => (t.id === id || t._id === id) && t.userId === userId,
      );
      if (index === -1) {
        res.status(404).json({ success: false, error: "Template not found" });
        return;
      }

      const existing = memoryStore.templates[index];
      if (title !== undefined) existing.title = title.trim();
      if (description !== undefined) existing.description = description.trim();
      if (content !== undefined) {
        existing.content = typeof content === "string" ? content : "";
      }
      if (category !== undefined) existing.category = category.trim();
      existing.updatedAt = new Date();

      memoryStore.templates[index] = existing;
      res.json({
        success: true,
        message: "Template updated successfully",
        data: existing,
      });
      return;
    }

    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      res.status(404).json({ success: false, error: "Template not found" });
      return;
    }

    if (title !== undefined) template.title = title.trim();
    if (description !== undefined) template.description = description.trim();
    if (content !== undefined)
      template.content = typeof content === "string" ? content : "";
    if (category !== undefined) template.category = category.trim();

    await template.save();

    res.json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (isUsingMemoryDB()) {
      const index = (memoryStore.templates || []).findIndex(
        (t) => (t.id === id || t._id === id) && t.userId === userId,
      );
      if (index === -1) {
        res.status(404).json({ success: false, error: "Template not found" });
        return;
      }
      memoryStore.templates.splice(index, 1);
      res.json({ success: true, message: "Template deleted successfully" });
      return;
    }

    const deleted = await Template.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      res.status(404).json({ success: false, error: "Template not found" });
      return;
    }

    res.json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    next(error);
  }
}
