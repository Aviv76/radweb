import { FindOptionsPerEntity, ColumnOptions } from '../core/dataInterfaces1';
import { NumberColumn, extractSortFromSettings, DataAreaSettings, EntityOptions, DateTimeColumn, DateColumn, StringColumn } from '../core/utils';

import { Entity, Column, Sort, ColumnCollection, FilterHelper, FilterConsumnerBridgeToUrlBuilder, CharDateStorage, DropDownItem, ClosedListColumn, DateTimeDateStorage } from '../core/utils';
import { GridSettings, Lookup, ColumnSetting } from '../core/utils';
import { InMemoryDataProvider, ActualInMemoryDataProvider } from '../core/inMemoryDatabase'
import { itAsync, Done } from './testHelper.spec';

import { Categories } from './testModel/models';
import { TestBed, async } from '@angular/core/testing';
import { error } from 'util';
import { Context } from '../context/Context';

//import { DataAreaCompnent } from '../utils/angular/dataArea';


export class LanguageColumn extends ClosedListColumn<Language> {
  constructor() {
    super(Language, 'שפה');
  }



}

export class Language {
  static Hebrew = new Language(0, 'עברית');
  static Russian = new Language(10, 'רוסית');
  static Amharit = new Language(20, 'אמהרית');
  constructor(public id: number,
    private caption: string) {

  }
  toString() {
    return this.caption;
  }

}



export async function createData(doInsert: (insert: (id: number, name: string, description?: string) => Promise<void>) => Promise<void>, settings?: EntityOptions) {

  let c = new Categories(settings);
  c.setSource(new InMemoryDataProvider());
  await doInsert(async (id, name, description) => {
    await c.source.Insert(c => {
      c.id.value = id;
      c.categoryName.value = name;
      c.description.value = description;
    });
  });
  return c;
}

async function insertFourRows(settings?: EntityOptions) {

  return createData(async i => {
    await i(1, 'noam', 'x');
    await i(4, 'yael', 'x');
    await i(2, 'yoni', 'y');
    await i(3, 'maayan', 'y');
  }, settings);
};

describe("Closed List  column", () => {

  it("Basic Operations", () => {
    let x = new LanguageColumn();
    x.rawValue = 0;
    expect(x.value).toBe(Language.Hebrew);
    x.value = Language.Russian;
    expect(x.rawValue).toBe(10);

    expect(x.getOptions().length).toBe(3);
  });
  it("loads and saved from Pojo correctly", () => {
    let x = new LanguageColumn();
    x.jsonName = 'abc';
    x.value = Language.Russian;
    let y: any = {};
    x.__addToPojo(y);
    expect(y[x.jsonName]).toBe(10);
    x.value = Language.Hebrew;
    expect(x.value).toBe(Language.Hebrew);
    x.__loadFromToPojo({ 'abc': 10 });
    expect(x.value).toBe(Language.Russian);

  });
});

describe("test row provider", () => {
  it("auto name", () => {
    var cat = new Categories();
    expect(cat.constructor.name).toBe('Categories');
    expect(cat.__getName()).toBe('Categories');
  });
  itAsync("Insert", async () => {


    var cat = new Categories();

    cat.setSource(new InMemoryDataProvider());

    let rows = await cat.source.find();
    expect(rows.length).toBe(0);
    await cat.source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam';
    });
    rows = await cat.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });

  itAsync("Insert another way", async () => {
    let x = new Categories();
    x.setSource(new InMemoryDataProvider());
    let rows = await x.source.find();
    expect(rows.length).toBe(0);
    var c = new Categories();
    c.id.value = 1;
    c.categoryName.value = 'noam';
    c.source = x.source;
    await c.save();
    rows = await x.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });

  itAsync("one more insert", async () => {
    let x = new Categories();
    x.setSource(new InMemoryDataProvider());
    var c = x.source.createNewItem();
    c.id.value = 1;
    c.categoryName.value = 'noam';
    c.save();
    var r = await x.source.find();
    expect(r[0].categoryName.value).toBe('noam');
  });
  itAsync("Yet Another Test", async () => {
    let x = new Categories();
    x.setSource(new InMemoryDataProvider());
    let rows = await x.source.find();
    expect(rows.length).toBe(0);
    await x.source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam';
    });
    rows = await x.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });
  itAsync("test  delete", async () => {
    let c = new Categories();
    c.setSource(new InMemoryDataProvider());
    c.id.value = 5;
    c.categoryName.value = 'noam';
    c.save();
    let rows = await c.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(5);
    await c.delete();
    rows = await c.source.find();
    expect(rows.length).toBe(0);

  });
  itAsync("test update", async () => {
    let c = new Categories();
    c.setSource(new InMemoryDataProvider());
    c.id.value = 5;
    c.categoryName.value = 'noam';
    c.save();
    let r = await c.source.find();
    expect(r[0].categoryName.value).toBe('noam');
    c.categoryName.value = 'yael';
    c.save();
    r = await c.source.find();
    expect(r[0].categoryName.value).toBe('yael');
  });

  itAsync("test filter", async () => {
    let c = await insertFourRows();

    let rows = await c.source.find();
    expect(rows.length).toBe(4);
    rows = await c.source.find({ where: c.description.isEqualTo('x') });
    expect(rows.length).toBe(2);
    rows = await c.source.find({ where: c.id.isEqualTo(4) });
    expect(rows.length).toBe(1);
    expect(rows[0].categoryName.value).toBe('yael');
    rows = await c.source.find({ where: c.description.isEqualTo('y').and(c.categoryName.isEqualTo('yoni')) });
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(2);
  });
  itAsync("sort", async () => {
    let c = await insertFourRows();
    let rows = await c.source.find({ orderBy: new Sort({ column: c.id }) });
    expect(rows[0].id.value).toBe(1);
    expect(rows[1].id.value).toBe(2);
    expect(rows[2].id.value).toBe(3);
    expect(rows[3].id.value).toBe(4);

    rows = await c.source.find({ orderBy: new Sort({ column: c.categoryName, descending: true }) });
    expect(rows[0].id.value).toBe(2);
    expect(rows[1].id.value).toBe(4);
    expect(rows[2].id.value).toBe(1);
    expect(rows[3].id.value).toBe(3);
  });
  itAsync("counts", async () => {
    let c = await insertFourRows();
    let count = await c.source.count();
    expect(count).toBe(4);
  });
  itAsync("counts with filter", async () => {
    let c = await insertFourRows();
    let count = await c.source.count(c.id.isLessOrEqualTo(2));
    expect(count).toBe(2);
  });
  itAsync("test grid update", async () => {
    let c = await insertFourRows();
    let ds = new GridSettings(c, {
      get: {
        orderBy: c => new Sort({ column: c.id })
      }
    });
    await ds.getRecords();
    expect(ds.items.length).toBe(4);
    expect(ds.items[0].categoryName.value).toBe('noam');
    ds.items[0].categoryName.value = 'noam honig';
    await ds.items[0].save();
    expect(ds.items[0].categoryName.value).toBe('noam honig');
  });
  itAsync("test grid update and validation cycle", async () => {
    let orderOfOperation = '';
    let c = await insertFourRows({
      name: undefined,
      onSavingRow: () => orderOfOperation += "EntityOnSavingRow,",
      onValidate: r => orderOfOperation += "EntityValidate,",
    });
    let ds = new GridSettings(c, {
      onSavingRow: r => orderOfOperation += "GridOnSavingRow,",
      onValidate: r => orderOfOperation += "GridValidate,",
      get: {
        orderBy: c => new Sort({ column: c.id })
      }
    });
    orderOfOperation = "";
    await ds.getRecords();

    let r = ds.items[0];
    r.categoryName.onValidate = () => orderOfOperation += "ColumnValidate,";

    expect(r.categoryName.value).toBe('noam');
    r.categoryName.value = 'noam honig';
    await ds._doSavingRow(r);
    expect(ds.items[0].categoryName.value).toBe('noam honig');
    expect(orderOfOperation).toBe("ColumnValidate,EntityValidate,GridValidate,GridOnSavingRow,EntityOnSavingRow,");
  });
  itAsync("test that it fails nicely", async () => {
    let c = await insertFourRows();
    c.id.value = 1;
    c.categoryName.value = 'bla bla';
    try {
      c.save();
      fail("Shouldnt have reached this");
    }
    catch (err) {

    }
    expect(c.categoryName.value).toBe('bla bla');
  });
  itAsync("update should fail nicely", async () => {
    let c = new Categories();
    c.setSource({ provideFor: () => new myDp<Categories>(() => new Categories()) });
    c.id.value = 1;
    c.categoryName.value = 'noam';
    await c.save();
    c.categoryName.value = 'yael';
    try {
      await c.save();
      fail("shouldnt be here");
    } catch (err) {
      expect(c.categoryName.value).toBe('yael');
    }
  });
  itAsync("filter should return none", async () => {

    let c = await insertFourRows();
    let n = c.source.createNewItem();
    let lookup = new Lookup(c);
    let r = await lookup.whenGet(c => c.categoryName.isEqualTo(undefined));
    expect(r.categoryName.value).toBe(undefined);

  });
  itAsync("column drop down", async () => {
    let c = new Categories();
    c.setSource(new InMemoryDataProvider());
    await c.source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam'
    });
    await c.source.Insert(c => {
      c.id.value = 2;
      c.categoryName.value = 'yael';
    });
    let cc = new ColumnCollection(() => c, () => true, undefined, () => true);
    let cs = { dropDown: { source: c } } as ColumnSetting<Categories>
    await cc.buildDropDown(cs);
    expect(cs.dropDown.items.length).toBe(2);
    expect(cs.dropDown.items[0].id).toBe(1);
    expect(cs.dropDown.items[1].id).toBe(2);
    expect(cs.dropDown.items[0].caption).toBe('noam');
    expect(cs.dropDown.items[1].caption).toBe('yael');

  });
  itAsync("column drop down with items", async () => {
    let c = new Categories();

    let cc = new ColumnCollection(() => c, () => true, undefined, () => true);
    let cs = { dropDown: { items: [{ id: 1, caption: 'a' }, { id: 0, caption: 'b' }] } } as ColumnSetting<Categories>
    await cc.buildDropDown(cs);
    expect(cs.dropDown.items.length).toBe(2);
    expect(cs.dropDown.items[0].id).toBe(1);
    expect(cs.dropDown.items[1].id).toBe(0);
    expect(cs.dropDown.items[0].caption).toBe('a');
    expect(cs.dropDown.items[1].caption).toBe('b');

  });
  itAsync("column drop down 1", async () => {
    let ctx = new Context(undefined);
    let c = ctx.create(Categories);
    c.setSource(new InMemoryDataProvider());

    await c.source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam'
    });
    await c.source.Insert(c => {
      c.id.value = 2;
      c.categoryName.value = 'yael';
    });
    let c1 = ctx.create(Categories);
    let cc = new ColumnCollection(() => c, () => true, undefined, () => true);
    let cs = { column: c1.id, dropDown: { source: c } } as ColumnSetting<Categories>
    await cc.add(cs);

    expect(cs.dropDown.items.length).toBe(2);
    expect(cs.dropDown.items[0].id).toBe(1);
    expect(cs.dropDown.items[1].id).toBe(2);
    expect(cs.dropDown.items[0].caption).toBe('noam');
    expect(cs.dropDown.items[1].caption).toBe('yael');
    var c2 = ctx.create(Categories);
    c2.id.value = 1;
    expect(cc._getColDisplayValue(cc.items[0], c2)).toBe('noam');

  });
  it("get value function works", () => {
    let a = new NumberColumn();
    a.value = 5;
    var cc = new DataAreaSettings({ columnSettings: () => [a] })


    expect(cc.columns._getColDisplayValue(cc.columns.items[0], null)).toBe('5');

  });
  it("get value function works", () => {
    let a = new NumberColumn();
    a.value = 5;
    var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
    cc.add(a);
    expect(cc._getColDisplayValue(cc.items[0], null)).toBe('5');

  });
  it("get value function works", () => {
    let a = new NumberColumn();
    a.value = 5;
    var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
    cc.add({ column: a, getValue: () => a.value * 2 });
    expect(cc._getColDisplayValue(cc.items[0], null)).toBe(10);
  });
  it("get value function works", () => {
    let a = new NumberColumn({ getValue: v => v *= 3 });
    a.value = 5;
    var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
    cc.add(a);
    expect(cc._getColDisplayValue(cc.items[0], null)).toBe(15);
  });

});
describe("column collection", () => {
  let ctx = new Context(undefined);
  itAsync("uses a saparate column", async () => {
    let c = ctx.create(Categories);
    c.categoryName.allowApiUpdate = false;
    var cc = new ColumnCollection(() => c, () => false, undefined, () => true);
    await cc.add(c.categoryName);
    expect(cc.items[0] === c.categoryName).toBe(false);
    expect(cc.items[0] === cc.items[0].column).toBe(false);
    expect(cc.items[0].caption == c.categoryName.caption).toBe(true);
    expect(cc.items[0].readonly).toBe(true);
    expect(cc.items[0].inputType == c.categoryName.inputType).toBe(true);
  })
  itAsync("jsonSaverIsNice", async () => {
    let c = ctx.create(Categories);
    var cc = new ColumnCollection(() => c, () => false, undefined, () => true);
    await cc.add(c.categoryName);
    expect(cc.__columnTypeScriptDescription(cc.items[0], "x")).toBe("x.categoryName");
    cc.items[0].caption = 'name';
    expect(cc.__columnTypeScriptDescription(cc.items[0], "x")).toBe(`{
    column: x.categoryName, 
    caption: 'name'
  }`);
  })
  itAsync("works ok with filter", async () => {
    let c = ctx.create(Categories);
    var cc = new ColumnCollection(() => c, () => false, new FilterHelper(() => { }), () => true);
    await cc.add(c.id);
    cc.filterHelper.filterColumn(cc.items[0].column, false, false);
    expect(cc.filterHelper.isFiltered(cc.items[0].column)).toBe(true);

  });
});
describe("grid settings ",
  () => {
    let ctx = new Context(undefined);
    it("sort is displayed right", () => {
      let c = ctx.create(Categories);
      c.setSource(new InMemoryDataProvider());
      let gs = new GridSettings(c);
      expect(gs.sortedAscending(c.id)).toBe(false);
      expect(gs.sortedDescending(c.id)).toBe(false);
      gs.sort(c.id);
      expect(gs.sortedAscending(c.id)).toBe(true);
      expect(gs.sortedDescending(c.id)).toBe(false);
      gs.sort(c.id);
      expect(gs.sortedAscending(c.id)).toBe(false);
      expect(gs.sortedDescending(c.id)).toBe(true);
    });
    it("sort is displayed right on start", () => {
      let c = ctx.create(Categories);
      c.setSource(new InMemoryDataProvider());
      let gs = new GridSettings(c, { get: { orderBy: c => new Sort({ column: c.categoryName }) } });
      expect(gs.sortedAscending(c.categoryName)).toBe(true);
      expect(gs.sortedDescending(c.categoryName)).toBe(false);
      expect(gs.sortedAscending(c.id)).toBe(false);
      expect(gs.sortedDescending(c.id)).toBe(false);
      gs.sort(c.id);
      expect(gs.sortedAscending(c.id)).toBe(true);
      expect(gs.sortedDescending(c.id)).toBe(false);
      expect(gs.sortedAscending(c.categoryName)).toBe(false);
      expect(gs.sortedDescending(c.categoryName)).toBe(false);
    });
    it("paging works", async () => {
      let c = await createData(async i => {
        i(1, "a");
        i(2, "b");
        i(3, "a");
        i(4, "b");
        i(5, "a");
        i(6, "b");
        i(7, "a");
        i(8, "b");
      });

      let ds = new GridSettings(c, { get: { limit: 2 } });
      await ds.getRecords();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id.value).toBe(1);
      await ds.nextPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id.value).toBe(3);
      await ds.nextPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id.value).toBe(5);
      await ds.previousPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id.value).toBe(3);
    });
    it("paging works with filter", async () => {
      let c = await createData(async i => {
        i(1, "a");
        i(2, "b");
        i(3, "a");
        i(4, "b");
        i(5, "a");
        i(6, "b");
        i(7, "a");
        i(8, "b");
      });

      let ds = new GridSettings(c, { get: { limit: 2, where: c => c.categoryName.isEqualTo('b') } });
      await ds.getRecords();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id.value).toBe(2);
      await ds.nextPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id.value).toBe(6);
      await ds.nextPage();
      expect(ds.items.length).toBe(0);

      await ds.previousPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id.value).toBe(6);
    });
  });
describe("order by api", () => {
  it("works with sort", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => new Sort({ column: c.id }) };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(1);
    expect(s.Segments[0].column).toBe(c.id);


  });
  it("works with columns", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => c.id };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(1);
    expect(s.Segments[0].column).toBe(c.id);
  });

  it("works with columns array", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => [c.id, c.categoryName] };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].column).toBe(c.id);
    expect(s.Segments[1].column).toBe(c.categoryName);
  });
  it("works with segment array", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => [{ column: c.id }, { column: c.categoryName }] };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].column).toBe(c.id);
    expect(s.Segments[1].column).toBe(c.categoryName);
  });
  it("works with mixed column segment array", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => [c.id, { column: c.categoryName }] };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].column).toBe(c.id);
    expect(s.Segments[1].column).toBe(c.categoryName);
  });
  itAsync("test several sort options", async () => {
    let c = await createData(async i => {
      i(1, 'z');
      i(2, 'y');
    });

    let r = await c.source.find({ orderBy: c.categoryName });
    expect(r.length).toBe(2);
    expect(r[0].id.value).toBe(2);

    r = await c.source.find({ orderBy: [c.categoryName] });
    expect(r.length).toBe(2);
    expect(r[0].id.value).toBe(2);

    r = await c.source.find({ orderBy: [{ column: c.categoryName, descending: true }] });
    expect(r.length).toBe(2);
    expect(r[0].id.value).toBe(1);

  });
});
describe("test area", () => {
  it("works without entity", () => {
    let n = new NumberColumn();
    n.value = 5;
    let area = new DataAreaSettings({ columnSettings: () => [n] });
    expect(area.columns.items.length).toBe(1);
    expect(area.columns.__showArea()).toBe(true);
    expect(area.columns.getNonGridColumns().length).toBe(1);
  });
});
/*describe("test Grid Settings", () => {  remember to copy to data area tests
  it("works well with many columns", () => {

    let x = new GridSettings(new Categories(), {
      columnSettings: x => [
        { caption: 'a', getValue: r => '' },
        { caption: 'b', getValue: r => '' },
        { caption: 'c', getValue: r => '' },
        { caption: 'd', getValue: r => '' },
        { caption: 'e', getValue: r => '' },
        { caption: 'f', getValue: r => '' },
        { caption: 'g', getValue: r => '' },
        { caption: 'h', getValue: r => '' },
      ]
    });
    expect(x.columns.getGridColumns().length).toBe(5);
    expect(x.columns.getNonGridColumns().length).toBe(3);
    let area = new DataAreaCompnent();
    area.settings = x;
    area.columns = 2;
    expect(area.theColumns().length).toBe(2);
    expect(area.theColumns()[0].length).toBe(2);
    expect(area.theColumns()[1].length).toBe(1);

  });
});

*/
describe("test column value change", () => {
  it("should fire", () => {
    let d = new Done();
    let x = new NumberColumn({
      valueChange: () => d.ok()
    });
    x.value++;
    d.test();
  });
  it("should fire 2", () => {
    let d = new Done();
    let x = new NumberColumn();
    x.onValueChange = () => d.ok();
    x.value++;
    d.test();
  });
});
describe("test number column", () => {
  it("Number is always a number", () => {
    let x = new NumberColumn();
    var z: any = '123';
    x.value = z;
    x.value += 1;
    expect(x.value).toBe(124);
  });
});

describe("test datetime column", () => {
  it("stores well", () => {
    var x = new DateTimeColumn();
    x.value = new Date(1976, 11, 16, 8, 55, 31, 65)
    expect(x.rawValue).toBe('1976-12-16T06:55:31.065Z');


    expect(x.value.toISOString()).toBe(new Date(1976, 11, 16, 8, 55, 31, 65).toISOString());
  });
  it("stores well undefined", () => {
    var x = new DateTimeColumn();
    x.value = undefined;
    expect(x.value).toBe(undefined);
    expect(x.rawValue).toBe('');
  });
  it("displays empty date well", () => {
    var x = new DateColumn();
    x.rawValue = '';
    expect(x.displayValue).toBe('');
  });
  it("displays null date well", () => {
    var x = new DateColumn();
    x.value = null;
    expect(DateColumn.dateToString(null)).toBe('');
    expect(DateTimeColumn.dateToString(null)).toBe('');
    expect(x.displayValue).toBe('');
  });
  it("displays empty date well empty", () => {
    var x = new DateColumn();
    x.rawValue = '0000-00-00';
    expect(x.displayValue).toBe('');
  });
  it("date works", () => {
    var x = new DateColumn();

    x.value = new Date('1976-06-16');
    expect(x.rawValue).toBe('1976-06-16');
    expect(x.value.toISOString()).toBe(new Date('1976-06-16').toISOString());
    //  expect(x.dateValue.getHours()).toBe(0);
  });
  it("date Storage works", () => {
    var x = new DateTimeDateStorage();

    expect(x.toDb('1976-06-16').toLocaleDateString()).toBe(new Date(1976, 5, 16, 0, 0, 0).toLocaleDateString());

  });
});
describe("Test char date storage", () => {
  let x = new CharDateStorage();
  it("from db", () => {
    expect(x.fromDb('19760616')).toBe('1976-06-16');
  });
  it("to db", () => {
    expect(x.toDb('1976-06-16')).toBe('19760616');
  });
});
describe("test parameter priority", () => {
  it("a", () => {
    let t = new testMyColumn();
    expect(t.allowApiUpdate).toBe(false);
    t = new testMyColumn({ allowApiUpdate: true });
    expect(t.allowApiUpdate).toBe(false);
    let s = new StringColumn();
    expect(s.allowApiUpdate).toBe(true);
  });
  it("b", () => {
    let s = new AnotherTest();
    expect(s.caption).toBe('default');
  });
  it("c", () => {
    let s = new AnotherTest('test');
    expect(s.caption).toBe('test');
  });
  it("d", () => {
    let s = new AnotherTest({caption:'test'});
    expect(s.caption).toBe('test');
  });
});

class myDp<T extends Entity<any>> extends ActualInMemoryDataProvider<T> {
  constructor(factory: () => T) {
    super(factory, []);
  }
  public update(id: any, data: any): Promise<any> {
    throw new Error("what");
  }
}


class testMyColumn extends StringColumn {
  allowApiUpdate = false;
}
class AnotherTest extends StringColumn {
  constructor(x?: ColumnOptions<string>) {
    super(x);
    if (!this.caption)
      this.caption = 'default';
  }
}