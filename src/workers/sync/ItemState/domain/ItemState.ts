import { Delta } from './Delta';

export class ItemState {
	constructor(private delta: Delta) {}

	public is(delta: Delta): boolean {
		return this.delta === delta;
	}
}
