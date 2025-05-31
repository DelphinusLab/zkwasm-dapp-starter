INSTALL_DIR=./ts/node_modules/zkwasm-ts-server/src/application
RUNNING_DIR=./ts/node_modules/zkwasm-ts-server
BUILD_ARTIFACTS_DIR=./build-artifacts

default: build

./src/admin.pubkey: ./ts/node_modules/zkwasm-ts-server/src/init_admin.js
	@node ./ts/node_modules/zkwasm-ts-server/src/init_admin.js ./src/admin.pubkey

./ts/src/service.js:
	@cd ./ts && npx tsc && cd -

build: ./src/admin.pubkey ./ts/src/service.js
	@wasm-pack build --release --out-name application --out-dir pkg
	@wasm-opt -Oz -o $(INSTALL_DIR)/application_bg.wasm pkg/application_bg.wasm
	@cp pkg/application_bg.wasm $(INSTALL_DIR)/application_bg.wasm
	@cp pkg/application_bg.wasm.d.ts $(INSTALL_DIR)/application_bg.wasm.d.ts
	@cd $(RUNNING_DIR) && npx tsc && cd -
	@MD5_VALUE=$$(md5sum pkg/application_bg.wasm | awk '{print $$1}' | tr 'a-z' 'A-Z') && \
	echo "Calculated MD5: $$MD5_VALUE" && \
	mkdir -p $(BUILD_ARTIFACTS_DIR)/application
	@cp $(INSTALL_DIR)/application_bg.wasm $(BUILD_ARTIFACTS_DIR)/application/
	@cp $(INSTALL_DIR)/application_bg.wasm.d.ts $(BUILD_ARTIFACTS_DIR)/application/

clean:
	@rm -rf pkg
	@rm -rf ./src/admin.pubkey
	@rm -rf $(BUILD_ARTIFACTS_DIR)
	@rm -rf helm-charts

run:
	@node ./ts/src/service.js

deploy:
	@docker build --file ./deploy/service.docker -t zkwasm-server . --network=host
