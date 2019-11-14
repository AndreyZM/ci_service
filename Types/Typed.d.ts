type Depromise<T> = T extends Promise<(infer R)> ? R : T;
type ReturnTypeDP<T extends (...args: any) => any> = Depromise<ReturnType<T>>;