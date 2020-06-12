function createMatrix(cols, rows, filler) {
	let rowModel = [...Array(rows)];
	return [...Array(cols)].map((e, i) => rowModel.map((e, j) => filler(i, j)));
}

function randomMatrix(cols, rows) {
	return createMatrix(cols, rows, Math.random);
}

function transpose(m) {
	return createMatrix(m[0].length, m.length, (i, j) => m[j][i]);
}

function iterate(m, fn) {
	for (let i = 0; i < m.length; i++) {
		for (let j = 0; j < m[i].length; j++) {
			fn(i, j, m[i][j]);
		}
	}
}

// gets a single value in a matrix-matrix multiplication (dot product)
function mmultAt(m1, m2, row, col) {
	let sum = 0;
	for (let k = 0; k < m2.length; k++) {
		sum += m1[row][k] * m2[k][col];
	}
	return sum;
}

function mmult(m1, m2) {
	return createMatrix(m1.length, m2[0].length, (i, j) => mmultAt(m1, m2, i, j));
}

function factorization(data, options) {
	options = Object.assign({
		features: 10,
		steps: 5000,
		rate: .0002,
		regularization: .02,
		tolerance: 0.001,
		usersFeatures: undefined,
		itemsFeatures: undefined,
	}, options);

	let usersFeatures = options.usersFeatures;
	if (!usersFeatures) {
		usersFeatures = randomMatrix(data.length, options.features);
	}
	let itemsFeatures = options.itemsFeatures;
	if (!itemsFeatures) {
		itemsFeatures = randomMatrix(data[0].length, options.features);
	}

	itemsFeatures = transpose(itemsFeatures);

	for (let step = 0; step < options.steps; step++) {
		if ((step + 1) % 1000 === 0) console.log('  iteration ' + (step + 1));
		iterate(data, (i, j, score) => {
			if (!score) {
				return;
			}
			let scoreEstimate = mmultAt(usersFeatures, itemsFeatures, i, j);
			let localErr = score - scoreEstimate;
			for (let k = 0; k < options.features; k++) {
				let userFeature = usersFeatures[i][k];
				let itemFeature = itemsFeatures[k][j];
				usersFeatures[i][k] += options.rate * (2 * localErr * itemFeature - options.regularization * userFeature);
				itemsFeatures[k][j] += options.rate * (2 * localErr * userFeature - options.regularization * itemFeature);
			}
		});
	}

	let reconstructed = mmult(usersFeatures, itemsFeatures);

	let error = 0;
	iterate(data, (i, j, score) => {
		if (!score) {
			return;
		}
		let diff = score - reconstructed[i][j];
		error += diff * diff;
		for (let k = 0; k < options.features; k++) {
			let userF = usersFeatures[i][k];
			let itemF = itemsFeatures[k][j];
			error += options.regularization * .5 * (userF * userF + itemF * itemF);
		}
	});

	return {
		error,
		reconstructed,
		usersFeatures,
		itemsFeatures: transpose(itemsFeatures)
	};
}

module.exports = factorization;
