export class DSU<T extends string | number> {
  private readonly parent: number[] = [];
  private readonly rank: number[] = [];
  private readonly mapping: Map<number, T> = new Map();
  private readonly inverseMapping: Map<T, number> = new Map();
  private _fullyDisjoint: boolean = true;


  public get fullyDisjoint(): boolean {
    return this._fullyDisjoint;
  }
  private get n(): number {
    return this.parent.length;
  }

  constructor() {
  }

  public addElement(x: T): void {
    if (this.inverseMapping.has(x)) return;

    const index = this.parent.length;
    this.parent.push(-1);
    this.rank.push(0);
    this.mapping.set(index, x);
    this.inverseMapping.set(x, index);

  }

  public hasElement(x: T): boolean {
    return this.inverseMapping.has(x);
  }

  public find(x: T): T | null {
    if (!this.hasElement(x)){
      return null;
    }
    return this.mapping.get(this._find(this.inverseMapping.get(x)!))!;
  }

  /**
   * 
   * @returns The representative class to which the elements now belong
   */
  public union(x: T, y: T): T {
    const _x = this.inverseMapping.get(x);
    const _y = this.inverseMapping.get(y);

    if (_x === undefined || _y === undefined){
      throw new Error(`Element ${x} or ${y} not found in DSU`);
    }

    if (_x === _y){
      this._fullyDisjoint = false;
    }
    this._union(_x, _y);

    return this.mapping.get(this._find(_x))!;
  }

  public same(x: T, y: T): boolean {
    if (!this.inverseMapping.has(x) || !this.inverseMapping.has(y)){
      throw new Error(`Element ${x} or ${y} not found in DSU`);
    }
    return this._same(this.inverseMapping.get(x)!, this.inverseMapping.get(y)!);
  }

  public getComponents(): Set<T>[] {
    return this._getComponents().map(component => new Set(Array.from(component).map(index => this.mapping.get(index)!)));
  }

  private _find(x: number): number {
    if (this.parent[x] == -1) {
      return x;
    }
    return this.parent[x] = this._find(this.parent[x]);
  }

  private _union(x: number, y: number): void {
    const rootX = this._find(x);
    const rootY = this._find(y);
    if (rootX != rootY) {
      if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY;
      } else if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX;
      } else {
        this.parent[rootY] = rootX;
        this.rank[rootX]++;
      }
    }
  }

  private _same(x: number, y: number): boolean {
    return this._find(x) == this._find(y);
  }

  private _getComponents(): Set<number>[]{
    const components = new Map<number, Set<number>>();
    for (let i = 0; i < this.n; i++){
      const root = this._find(i);
      if (!components.has(root)){
        components.set(root, new Set());
      }
      components.get(root)!.add(i);
    }
    return Array.from(components.values());
  }
}