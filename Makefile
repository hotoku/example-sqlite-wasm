deploy: tree-clean
	git tag $$(date "+%Y%m%dT%H%M%S")
	git push origin --tags
	npm run deploy

tree-clean:
	@if [ $$(git status -s | wc -l) -ge 1 ]; then echo "Error: local tree is dirty."; false; fi
