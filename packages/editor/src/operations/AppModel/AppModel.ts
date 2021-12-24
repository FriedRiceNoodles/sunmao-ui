import { ApplicationComponent } from '@sunmao-ui/core';
import { parseType } from '@sunmao-ui/runtime';
import { ComponentModel } from './ComponentModel';
import {
  ComponentId,
  ComponentType,
  IApplicationModel,
  IComponentModel,
  IModuleModel,
  SlotName,
} from './IAppModel';
import { genComponent } from './utils';

export class ApplicationModel implements IApplicationModel {
  model: IComponentModel[] = [];
  modules: IModuleModel[] = [];
  private schema: ApplicationComponent[] = [];
  private componentMap: Record<ComponentId, IComponentModel> = {};

  constructor(components: ApplicationComponent[]) {
    this.schema = components;
    this.resolveTree(components);
  }

  get allComponents(): IComponentModel[] {
    const result: IComponentModel[] = []
    this.traverseTree(c => {
      result.push(c)
    })
    return result
  }

  appendChild(component: IComponentModel) {
    component.appModel = this;
    component.parentId = null;
    component.parentSlot = null;
    component.parent = null;
    if (component.slotTrait) {
      component.removeTrait(component.slotTrait.id)
    }
    this.model.push(component)
    this.registerComponent(component)
  }

  registerComponent(component: IComponentModel) {
    this.componentMap[component.id] = component;
  }

  toSchema(): ApplicationComponent[] {
    this.schema = this.allComponents.map(c => {
      return c.toSchema();
    });

    return this.schema;
  }

  createComponent(type: ComponentType, id?: ComponentId): IComponentModel {
    const component = genComponent(type, id || this.genId(type));
    return new ComponentModel(this, component);
  }

  genId(type: ComponentType): ComponentId {
    const { name } = parseType(type);
    const componentsCount = this.allComponents.filter(
      component => component.type === type
    ).length;
    return `${name}${componentsCount + 1}` as ComponentId;
  }

  getComponentById(componentId: ComponentId): IComponentModel | undefined {
    return this.componentMap[componentId];
  }

  removeComponent(componentId: ComponentId) {
    const comp = this.componentMap[componentId];
    delete this.componentMap[componentId];
    if (comp.parentSlot && comp.parent) {
      const children = comp.parent.children[comp.parentSlot];
      comp.parent.children[comp.parentSlot] = children.filter(c => c !== comp);
    } else {
      this.model.splice(this.model.indexOf(comp), 1);

    }
  }

  private resolveTree(components: ApplicationComponent[]) {
    const allComponents = components.map(c => {
      const comp = new ComponentModel(this, c);
      this.componentMap[c.id as ComponentId] = comp;
      return comp;
    });

    allComponents.forEach(child => {
      if (child.parentId && child.parentSlot) {
        const parent = this.componentMap[child.parentId];
        if (parent) {
          if (parent.children[child.parentSlot]) {
            parent.children[child.parentSlot].push(child);
          } else {
            parent.children[child.parentSlot] = [child];
          }
        }
        child.parent = parent;
      } else {
        this.model.push(child);
      }
    });
  }

  private traverseTree(cb: (c: IComponentModel) => void) {
    function traverse(root: IComponentModel) {
      cb(root)
      for (const slot in root.children) {
        root.children[slot as SlotName].forEach(child => {
          traverse(child)
        })
      }
    }
    this.model.forEach((parent) => {
      traverse(parent);
    })
  }
}
