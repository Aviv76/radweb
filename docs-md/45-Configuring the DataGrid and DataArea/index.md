One of the columns that is displayed on the grid is the `id` column, and although this value is important to the application, it has little value for the user, let's configure the `DataGrid` to only show the columns that we want. In the `products.component.ts` file
```csdiff
import { Component, OnInit } from '@angular/core';
import { Context } from 'radweb';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass']
})
export class ProductsComponent implements OnInit {

  constructor(private context: Context) { }

  products = this.context.for(Products).gridSettings({
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
+   columnSettings: p => [
+     p.name,
+     {
+       column: p.price,
+       width: '75'
+     },
+     p.availableFrom,
+     p.availableTo
+   ]
  });
  ngOnInit() {
  }
}

```
Let's review:
1. On line 18 we've set the `columnsSettings` property with a function that returns an array of column.
2. On line 19 we've included the name column.
3. On line 20-23 we've defined the `price` column, with display specific properties (in this case, width of 75 pixels)
4. On line 24-25 we've added the `availableFrom` and the `availableTo` columns

## Data Area

We can also limit the number of columns that are displayed on a grid, by setting the `numOfColumnsInGrid` all remaining columns will be placed in a `data-area` below the grid.
```csdiff
products = this.context.for(Products).gridSettings({
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    columnSettings: p => [
      p.name,
      {
        column: p.price,
        width: '75'
      },
      p.availableFrom,
      p.availableTo
    ]
+   ,numOfColumnsInGrid:2
  });
```
![](2019-10-06_15h22_36.png)

We can disable this behavior by setting the `hideDataArea` property to false:
```csdiff
products = this.context.for(Products).gridSettings({
  allowInsert: true,
  allowUpdate: true,
  allowDelete: true,
  columnSettings: p => [
    p.name,
    {
      column: p.price,
      width: '75'
    },
    p.availableFrom,
    p.availableTo
  ]
  ,numOfColumnsInGrid:2
+ ,hideDataArea:true
});
```

We can add the `DataArea` with all the columns that are not included in the grid, by adding the `data-area` tag to the `products.component.html`

```csdiff
  <data-grid2 [settings]="products" [height]="300"></data-grid2>
+ <br>
+ <br>
+ <data-area [settings]="products"></data-area>
```

We can even have more control over the `DataArea` and add multiple `DataArea`s by defining them in the `products.component.ts`
```csdiff
products = this.context.for(Products).gridSettings({
  allowInsert: true,
  allowUpdate: true,
  allowDelete: true,
  columnSettings: p => [
    p.name,
    {
      column: p.price,
      width: '75'
    },
    p.availableFrom,
    p.availableTo
  ]
  , numOfColumnsInGrid: 2
  , hideDataArea: true

});
+productsArea = this.products.addArea({
+  columnSettings: p => [
+    p.availableFrom,
+    p.availableTo
+  ]
+});

ngOnInit() {
}
```
and in the `products.component.html` we'll use that `productsArea` settings:
```csdiff
+ <data-grid2 [settings]="products" [height]="300"></data-grid2>
+ <br>
+ <br>
+ <data-area [settings]="productsArea"></data-area>
```

Data Areas are extremely powerful, as they allow us to define a set of columns and their fields, without worrying too much about designing them and their functionality.