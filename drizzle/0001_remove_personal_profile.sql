UPDATE records SET payload=json_set(payload,
 '$.fit','','$.risk','','$.direction','','$.priority','项目资料','$.group','项目资料',
 '$.requirements',json(COALESCE((SELECT json_group_array(json_set(value,'$.action','')) FROM json_each(records.payload,'$.requirements')),'[]')),
 '$.tracks',json(COALESCE((SELECT json_group_array(json_set(value,'$.fit','')) FROM json_each(records.payload,'$.tracks')),'[]'))), version=version+1
 WHERE id LIKE 'program:%' AND COALESCE(json_extract(payload,'$.deleted'),0)=0;
UPDATE records SET payload=replace(payload,'"必须；在读UChicago本科生或UChicago毕业生可免，你不适用此豁免。"','"必须；在读UChicago本科生或UChicago毕业生可免。"') WHERE id LIKE 'program:%';
UPDATE records SET payload=replace(payload,'"非英国本科学位申请者须交GMAT或GRE（GMAT偏好）；你需准备。"','"非英国本科学位申请者须交GMAT或GRE（GMAT偏好）。"') WHERE id LIKE 'program:%';
UPDATE records SET payload=replace(payload,'"HKUST MSc in Finance（暂按hust可能指港科大）"','"HKUST MSc in Finance"') WHERE id LIKE 'program:%';
UPDATE records SET payload=replace(payload,'"此前大学教育在英国以外的申请者须提交近期 GRE；NYUAD背景需准备。"','"此前大学教育在英国以外的申请者须提交近期 GRE。"') WHERE id LIKE 'program:%';
UPDATE records SET payload=replace(payload,'"TOEFL/IELTS按Stanford研究生院规则；NYUAD全英文本科豁免须核实。"','"TOEFL/IELTS按Stanford研究生院规则；全英文本科豁免须核实。"') WHERE id LIKE 'program:%';
UPDATE records SET payload=replace(payload,'"GRE或GMAT必须，偏好GRE；Cornell在校生例外不适用于NYUAD。"','"GRE或GMAT必须，偏好GRE；Cornell在校生有例外。"') WHERE id LIKE 'program:%';
UPDATE records SET payload=replace(payload,'"官网未明确标注入学年份，因此暂不自动倒排。Spring仅限Cornell本科，不适用于你。"','"官网未明确标注入学年份，因此暂不自动倒排。Spring仅限Cornell本科。"') WHERE id LIKE 'program:%';
