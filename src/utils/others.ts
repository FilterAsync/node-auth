import ms from "ms";

const seconds = 1e3;

export function s(value: number): string;

export function s(value: string): number;

export function s(value: any): any {
	return ms(typeof value === "string" ? value : ms(value)) / seconds;
}
