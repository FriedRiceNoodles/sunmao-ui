import { Application } from '@sunmao-ui/core';
import { ApplicationModel } from '../../src/operations/AppModel/AppModel';
import {
  ComponentId,
  ComponentType,
  SlotName,
  TraitType,
} from '../../src/operations/AppModel/IAppModel';

const AppSchema: Application = {
  kind: 'Application',
  version: 'example/v1',
  metadata: { name: 'dialog_component', description: 'dialog component example' },
  spec: {
    components: [
      {
        id: 'hstack1',
        type: 'chakra_ui/v1/hstack',
        properties: { spacing: '24px' },
        traits: [],
      },
      {
        id: 'vstack1',
        type: 'chakra_ui/v1/vstack',
        properties: {},
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'hstack1', slot: 'content' } },
          },
        ],
      },
      {
        id: 'text3',
        type: 'core/v1/text',
        properties: { value: { raw: 'VM1', format: 'plain' } },
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'vstack1', slot: 'content' } },
          },
        ],
      },
      {
        id: 'text4',
        type: 'core/v1/text',
        properties: { value: { raw: '虚拟机', format: 'plain' } },
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'vstack1', slot: 'content' } },
          },
        ],
      },
      {
        id: 'hstack2',
        type: 'chakra_ui/v1/hstack',
        properties: { spacing: '24px', align: '' },
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'hstack1', slot: 'content' } },
          },
        ],
      },
      {
        id: 'text1',
        type: 'core/v1/text',
        properties: { value: { raw: 'text', format: 'plain' } },
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'hstack2', slot: 'content' } },
          },
        ],
      },
      {
        id: 'text2',
        type: 'core/v1/text',
        properties: { value: { raw: 'text', format: 'plain' } },
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'hstack2', slot: 'content' } },
          },
        ],
      },
      {
        id: 'button1',
        type: 'chakra_ui/v1/button',
        properties: {
          text: { raw: 'text', format: 'plain' },
          colorScheme: 'blue',
          isLoading: false,
        },
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'hstack2', slot: 'content' } },
          },
        ],
      },
      {
        id: 'moduleContainer1',
        type: 'core/v1/moduleContainer',
        properties: { id: 'myModule', type: 'custom/v1/module' },
        traits: [
          {
            type: 'core/v1/slot',
            properties: { container: { id: 'hstack1', slot: 'content' } },
          },
        ],
      },
      {
        id: 'hstack3',
        type: 'chakra_ui/v1/hstack',
        properties: { spacing: '24px' },
        traits: [],
      },
    ],
  },
};
describe('change component properties', () => {
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  const text1 = appModel.getComponentById('text1' as any);
  text1!.updateComponentProperty('value', { raw: 'hello', format: 'md' });
  const newSchema = appModel.toSchema();

  it('change component properties', () => {
    expect(newSchema[5].properties.value).toEqual({ raw: 'hello', format: 'md' });
  });

  it('keep immutable after changing component properties', () => {
    expect(origin).not.toBe(newSchema);
    expect(origin[0]).toBe(newSchema[0]);
    expect(origin[1]).toBe(newSchema[1]);
    expect(origin[5]).not.toBe(newSchema[5]);
  });
});

describe('remove component', () => {
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  appModel.removeComponent('text1' as any);
  it('remove component', () => {
    const newSchema = appModel.toSchema();
    expect(origin.length - 1).toEqual(newSchema.length);
    expect(newSchema.some(c => c.id === 'text1')).toBe(false);
  });
  it('remove top level component', () => {
    appModel.removeComponent('hstack3' as any);
    const newSchema = appModel.toSchema();
    expect(origin.length - 2).toEqual(newSchema.length);
    expect(newSchema.some(c => c.id === 'text1')).toBe(false);
  });
  const newSchema = appModel.toSchema();
  it('keep immutable after removing component', () => {
    expect(origin).not.toBe(newSchema);
    expect(origin[0]).toBe(newSchema[0]);
  });
});

describe('create component', () => {
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  const newComponent = appModel.createComponent('core/v1/text' as ComponentType);
  it('create component', () => {
    expect(newComponent.id).toEqual('text5');
  });
  describe('append component to parent', () => {
    const parent = appModel.getComponentById('vstack1' as any)!;
    newComponent.appendTo(parent, 'content' as SlotName);
    expect(newComponent.parent).toBe(parent);
    expect(newComponent.parentId).toEqual('vstack1');
    expect(newComponent.parentSlot).toEqual('content');

    it('create slot trait', () => {
      expect(newComponent.traits[0].type).toEqual('core/v1/slot');
      expect(newComponent.traits[0].rawProperties).toEqual({
        container: { id: 'vstack1', slot: 'content' },
      });
    });
    it('update parent children', () => {
      expect(parent.children['content' as any]).toContain(newComponent);
      expect(newComponent.traits[0].rawProperties).toEqual({
        container: { id: 'vstack1', slot: 'content' },
      });
    });
    it('is in right place in allComponents', () => {
      expect(appModel.allComponents[4]).toBe(
        newComponent
      );
    });
    it('keep immutable after create component', () => {
      const newSchema = appModel.toSchema();
      expect(origin).not.toBe(newSchema);
      expect(origin.length).toBe(newSchema.length - 1);
      expect(origin[0]).toBe(newSchema[0]);
      expect(origin[1]).toBe(newSchema[1]);
      const newComponentSchema = newSchema[4];
      expect(newComponentSchema.id).toBe('text5');
      expect(newComponentSchema.traits[0].properties).toEqual({
        container: { id: 'vstack1', slot: 'content' },
      });
    });
  });
});

describe('append component', () => {
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  const text1 = appModel.getComponentById('text1' as any)!;
  it('append component to top level', () => {
    text1.appendTo()
    const newSchema = appModel.toSchema();
    expect(newSchema[newSchema.length - 1].id).toBe('text1');
    expect(newSchema.length).toBe(origin.length);
  })
})

describe('add trait', () => {
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  const text1 = appModel.getComponentById('text1' as any);
  text1!.addTrait('core/v1/state' as TraitType, { key: 'value' });
  const newSchema = appModel.toSchema();

  it('add trait', () => {
    expect(newSchema[5].traits[1].properties.key).toEqual('value');
  });
  it('keep immutable after adding trait', () => {
    expect(origin).not.toBe(newSchema);
    expect(origin[0]).toBe(newSchema[0]);
    expect(origin[1]).toBe(newSchema[1]);
    expect(origin[5]).not.toBe(newSchema[5]);
  });
});

describe('remove trait', () => {
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  const text1 = appModel.getComponentById('text1' as any)!;
  text1!.removeTrait(text1.traits[0].id);
  const newSchema = appModel.toSchema();
  it('remove trait', () => {
    expect(newSchema[5].traits.length).toEqual(0);
  });

  it('keep immutable after adding trait', () => {
    expect(origin).not.toBe(newSchema);
    expect(origin[0]).toBe(newSchema[0]);
    expect(origin[1]).toBe(newSchema[1]);
    expect(origin[5]).not.toBe(newSchema[5]);
  });
});

describe('change component id', () => {
  const newId = 'newHstack1' as ComponentId;
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  const hStack1 = appModel.getComponentById('hstack1' as ComponentId)!;
  hStack1.changeId(newId);
  const newSchema = appModel.toSchema();
  it('change component id', () => {
    expect(newSchema[0].id).toEqual(newId);
  });
  it('change children slot trait', () => {
    expect(newSchema[1].traits[0].properties.container).toEqual({
      id: newId,
      slot: 'content',
    });
    expect(newSchema[4].traits[0].properties.container).toEqual({
      id: newId,
      slot: 'content',
    });
    expect(newSchema[8].traits[0].properties.container).toEqual({
      id: newId,
      slot: 'content',
    });
  });

  it('keep immutable after changing component id', () => {
    expect(origin).not.toBe(newSchema);
    expect(origin[0]).not.toBe(newSchema[0]);
    expect(origin[1]).not.toBe(newSchema[1]);
    expect(origin[4]).not.toBe(newSchema[4]);
    expect(origin[8]).not.toBe(newSchema[8]);
    expect(origin[2]).toBe(newSchema[2]);
    expect(origin[3]).toBe(newSchema[3]);
  });
});

describe('move component', () => {
  const appModel = new ApplicationModel(AppSchema.spec.components);
  const origin = appModel.toSchema();
  const hstack1 = appModel.getComponentById('hstack1' as ComponentId)!;
  const text1 = appModel.getComponentById('text1' as ComponentId)!;

  it('can move component', () => {
    const text2 = appModel.getComponentById('text2' as ComponentId)!;
    text1.moveAfter(text2);
    const newSchema = appModel.toSchema();
    expect(text1.parent!.children['content' as SlotName][0].id).toEqual('text2');
    expect(text1.parent!.children['content' as SlotName][1].id).toEqual('text1');
    expect(newSchema[5].id).toEqual('text2');
    expect(newSchema[6].id).toEqual('text1');
  });

  it('can move top level component', () => {
    const hstack3 = appModel.getComponentById('hstack3' as ComponentId)!;
    hstack1.moveAfter(hstack3);
    const newSchema = appModel.toSchema();
    expect(appModel.model[0].id).toEqual('hstack3');
    expect(appModel.model[1].id).toEqual('hstack1');
    expect(newSchema[0].id).toEqual('hstack3');
    expect(newSchema[1].id).toEqual('hstack1');
  });
  it('can move component to the first', () => {
    hstack1.moveAfter(null);
    const newSchema = appModel.toSchema();
    expect(appModel.model[0].id).toEqual('hstack1');
    expect(newSchema[0].id).toEqual('hstack1');
  });

  it('keep immutable after moving component', () => {
    const text2 = appModel.getComponentById('text2' as ComponentId)!;
    text2.moveAfter(text1);
    const newSchema = appModel.toSchema();
    expect(origin).not.toBe(newSchema);
    expect(origin.every((v, i) => v === newSchema[i])).toBe(true);
  });
});
