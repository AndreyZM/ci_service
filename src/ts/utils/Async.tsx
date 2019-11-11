import React = require("react");

export class Async<T> extends React.Component<{ promise: PromiseLike<T>, fallback?: React.ReactNode, children?: (loaded: T) => React.ReactNode}, { result?: T, resolved: boolean }>
{
	private currentPromise: PromiseLike<T>;
	public render()
	{
		return this.state && this.state.resolved && (this.props.children && this.props.children(this.state.result) || this.state.result) || this.props.fallback || false;
	}

	public componentWillReceiveProps(newProp)
	{
		if (this.currentPromise === newProp.promise)
			return;

		this.currentPromise = newProp.promise;
		let promise = this.currentPromise;

		newProp.promise.then((result) =>
		{
			if (promise === this.currentPromise)
				this.setState({ result, resolved: true });
		});
	}

	public componentWillMount()
	{
		this.componentWillReceiveProps(this.props);
	}
}