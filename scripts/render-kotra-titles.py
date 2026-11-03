"""제목 이미지 생성: python scripts/render-kotra-titles.py /로컬/KOTRA_BOLD.woff
글꼴 원본은 공식 배포처에서 받아 프로젝트 밖에 보관한다. 이 스크립트는 글꼴을 복사하지 않는다.
"""
import json, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
root=Path(__file__).resolve().parents[1]
font=TTFont(sys.argv[1]); glyphs=font.getGlyphSet(); cmap=font.getBestCmap()
labels=[
 ('start','도란을 시작하기 전에'),('observe','관찰 화면'),('relation-nav','관계 설정'),('history-nav','대화 기록'),('characters','캐릭터'),('relationships','마음의 거리'),
 ('character-edit','캐릭터 편집'),('relationship-edit','캐릭터 관계 설정'),('world','세계 설정'),
 ('places','장소 이름'),('autosave','이 브라우저에 자동 저장해요'),('plan','전개도 전체'),
 ('add','추가하기'),('selection','선택한 요소'),('memory','대화 기억'),('schedule','하루 일정'),
 ('child','자녀 설정'),('lines-memory','기본 대사와 대화 기억'),('event','작은 사건'),
 ('past-character','지난 캐릭터'),('plan-edit','전개도 편집'),('home','집'),('office','회사'),
 ('school','도란 고등학교'),('university','도란 대학교'),('square','광장'),
]
folder=root/'public'/'titles';folder.mkdir(exist_ok=True)
manifest={}
for slug,text in labels:
 x=0;paths=[];bounds=[]
 for char in text:
  name=cmap.get(ord(char));
  if not name: continue
  pen=SVGPathPen(glyphs);glyphs[name].draw(pen);bp=BoundsPen(glyphs);glyphs[name].draw(bp)
  if pen.getCommands():paths.append(f'<path transform="translate({x} 0)" d="{pen.getCommands()}"/>')
  if bp.bounds:
   a,b,c,d=bp.bounds;bounds.append((a+x,b,c+x,d))
  x+=font['hmtx'][name][0]
 minx=min(b[0] for b in bounds);miny=min(b[1] for b in bounds);maxx=max(b[2] for b in bounds);maxy=max(b[3] for b in bounds);pad=12
 w=maxx-minx+pad*2;h=maxy-miny+pad*2
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><g transform="translate({pad-minx} {pad+maxy}) scale(1 -1)">{"".join(paths)}</g></svg>\n'
 (folder/(slug+'.svg')).write_text(svg)
 manifest[text]={'src':'./titles/'+slug+'.svg','ratio':round(w/h,5)}
(root/'src'/'kotra-titles.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
