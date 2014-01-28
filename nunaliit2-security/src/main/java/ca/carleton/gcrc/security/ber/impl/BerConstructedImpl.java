package ca.carleton.gcrc.security.ber.impl;

import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;
import java.util.Vector;

import ca.carleton.gcrc.security.ber.BerConstructed;
import ca.carleton.gcrc.security.ber.BerObject;

public class BerConstructedImpl extends BerObjectImpl implements BerConstructed {

	private Vector<BerObject> list = new Vector<BerObject>();

	public BerConstructedImpl() {
		
	}
	
	public BerConstructedImpl(BerObject.TypeClass typeClass, int type) {
		super(typeClass, type);
	}
	
	@Override
	public boolean isTypeConstructed() {
		return true;
	}
	
	/*
	 * **************************************************
	 * interface List
	 * **************************************************
	 */
	
	@Override
	public boolean add(BerObject arg0) {
		return list.add(arg0);
	}

	@Override
	public void add(int arg0, BerObject arg1) {
		list.add(arg0, arg1);
	}

	@Override
	public boolean addAll(Collection<? extends BerObject> arg0) {
		return list.addAll(arg0);
	}

	@Override
	public boolean addAll(int arg0, Collection<? extends BerObject> arg1) {
		return list.addAll(arg0, arg1);
	}

	@Override
	public void clear() {
		list.clear();
	}

	@Override
	public boolean contains(Object arg0) {
		return list.contains(arg0);
	}

	@Override
	public boolean containsAll(Collection<?> arg0) {
		return list.containsAll(arg0);
	}

	@Override
	public BerObject get(int arg0) {
		return list.get(arg0);
	}

	@Override
	public int indexOf(Object arg0) {
		return list.indexOf(arg0);
	}

	@Override
	public boolean isEmpty() {
		return list.isEmpty();
	}

	@Override
	public Iterator<BerObject> iterator() {
		return list.iterator();
	}

	@Override
	public int lastIndexOf(Object arg0) {
		return list.lastIndexOf(arg0);
	}

	@Override
	public ListIterator<BerObject> listIterator() {
		return list.listIterator();
	}

	@Override
	public ListIterator<BerObject> listIterator(int arg0) {
		return list.listIterator(arg0);
	}

	@Override
	public boolean remove(Object arg0) {
		return list.remove(arg0);
	}

	@Override
	public BerObject remove(int arg0) {
		return list.remove(arg0);
	}

	@Override
	public boolean removeAll(Collection<?> arg0) {
		return list.removeAll(arg0);
	}

	@Override
	public boolean retainAll(Collection<?> arg0) {
		return list.retainAll(arg0);
	}

	@Override
	public BerObject set(int arg0, BerObject arg1) {
		return list.set(arg0, arg1);
	}

	@Override
	public int size() {
		return list.size();
	}

	@Override
	public List<BerObject> subList(int arg0, int arg1) {
		return list.subList(arg0, arg1);
	}

	@Override
	public Object[] toArray() {
		return list.toArray();
	}

	@Override
	public <T> T[] toArray(T[] arg0) {
		return list.toArray(arg0);
	}
}
